import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiDownload,
  FiEdit2,
  FiLink,
  FiMessageSquare,
  FiPaperclip,
  FiPlus,
  FiRefreshCw,
  FiTag,
  FiTrash2,
  FiUserCheck,
  FiWatch,
} from 'react-icons/fi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { SelectField } from '../../components/SelectField';
import { SummaryRows } from '../../components/SummaryRows';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';

const commentVisibilityOptions = ['workspace', 'public', 'private'];
const attachmentVisibilityOptions = ['restricted', 'public'];
const linkTypeOptions = ['relates_to', 'blocks', 'blocked_by', 'duplicates', 'is_duplicated_by', 'custom'];

const today = () => new Date().toISOString().slice(0, 10);

const emptyCollaboration = () => ({
  activity: [],
  attachments: [],
  comments: [],
  labels: [],
  links: [],
  watchers: [],
  workLogs: [],
  workspaceLabels: [],
});

export const WorkItemDetail = ({ context, item, projectItems }) => {
  const action = useApiAction(context.addToast);
  const fileInputRef = useRef(null);
  const [collaboration, setCollaboration] = useState(emptyCollaboration);
  const [commentForm, setCommentForm] = useState({ bodyMarkdown: '', visibility: 'workspace' });
  const [commentEdit, setCommentEdit] = useState(null);
  const [linkForm, setLinkForm] = useState({ targetWorkItemId: '', linkType: 'relates_to', customLinkType: '' });
  const [workLogForm, setWorkLogForm] = useState({ minutesSpent: '30', workDate: today(), descriptionMarkdown: '' });
  const [workLogEdit, setWorkLogEdit] = useState(null);
  const [labelForm, setLabelForm] = useState({ name: '', color: '#2a7a8c' });
  const [labelId, setLabelId] = useState('');
  const [attachmentForm, setAttachmentForm] = useState({ checksum: '', visibility: 'restricted' });
  const [draggingFile, setDraggingFile] = useState(false);

  const workspaceId = item?.workspaceId || context.workspaceId;
  const currentUserId = context.currentUser?.id;
  const currentUserName = context.currentUser?.displayName || context.currentUser?.username || context.currentUser?.email || 'You';
  const canReadWorkItems = context.hasProjectPermission('work_item.read');
  const canComment = context.hasProjectPermission('work_item.comment');
  const canLink = context.hasProjectPermission('work_item.link');
  const canUpdateWorkItems = context.hasProjectPermission('work_item.update');
  const canCreateOwnWorkLogs = context.hasProjectPermission('work_log.create_own') || canUpdateWorkItems;
  const canUpdateOwnWorkLogs = context.hasProjectPermission('work_log.update_own') || canUpdateWorkItems;
  const canDeleteOwnWorkLogs = context.hasProjectPermission('work_log.delete_own') || canUpdateWorkItems;

  const workItemOptions = useMemo(
    () => projectItems.filter((candidate) => candidate.id !== item?.id),
    [item?.id, projectItems],
  );

  const workItemById = useMemo(() => {
    const rows = item ? [item, ...projectItems] : projectItems;
    return new Map(rows.map((row) => [row.id, row]));
  }, [item, projectItems]);

  const attachedLabelIds = useMemo(
    () => new Set(collaboration.labels.map((label) => label.id)),
    [collaboration.labels],
  );

  const unattachedLabels = useMemo(
    () => collaboration.workspaceLabels.filter((label) => !attachedLabelIds.has(label.id)),
    [attachedLabelIds, collaboration.workspaceLabels],
  );

  const watchingSelf = Boolean(currentUserId && collaboration.watchers.some((watcher) => watcher.userId === currentUserId));

  const loadCollaboration = async (workItemId = item?.id) => {
    if (!workItemId) {
      setCollaboration(emptyCollaboration());
      return;
    }
    if (!canReadWorkItems) {
      action.setError('Your current project role cannot read work item collaboration');
      return;
    }
    const loaded = await action.run(() => Promise.all([
      context.services.workItems.listComments(workItemId),
      context.services.workItems.listLinks(workItemId),
      context.services.workItems.listWatchers(workItemId),
      context.services.workItems.listWorkLogs(workItemId),
      workspaceId ? context.services.workItems.listWorkspaceLabels(workspaceId) : Promise.resolve([]),
      context.services.workItems.listWorkItemLabels(workItemId),
      context.services.workItems.listAttachments(workItemId),
      context.services.workItems.activity(workItemId, { limit: 25 }),
    ]));
    if (loaded) {
      const [comments, links, watchers, workLogs, workspaceLabels, labels, attachments, activity] = loaded;
      setCollaboration({
        activity: activity?.items || [],
        attachments: attachments || [],
        comments: comments || [],
        labels: labels || [],
        links: links || [],
        watchers: watchers || [],
        workLogs: workLogs || [],
        workspaceLabels: workspaceLabels || [],
      });
      if (!labelId && workspaceLabels?.length) {
        const firstAvailable = workspaceLabels.find((label) => !labels?.some((attached) => attached.id === label.id));
        setLabelId(firstAvailable?.id || '');
      }
    }
  };

  useEffect(() => {
    setCollaboration(emptyCollaboration());
    setCommentForm({ bodyMarkdown: '', visibility: 'workspace' });
    setCommentEdit(null);
    setLinkForm({ targetWorkItemId: '', linkType: 'relates_to', customLinkType: '' });
    setWorkLogForm({ minutesSpent: '30', workDate: today(), descriptionMarkdown: '' });
    setWorkLogEdit(null);
    setLabelId('');
    if (item?.id) {
      loadCollaboration(item.id);
    }
  }, [item?.id]);

  const refresh = async () => {
    await loadCollaboration();
  };

  const createComment = async (event) => {
    event.preventDefault();
    if (!canComment) {
      action.setError('Your current project role cannot add comments');
      return;
    }
    const created = await action.run(
      () => context.services.workItems.createComment(item.id, commentForm),
      'Comment added',
    );
    if (created) {
      setCommentForm({ bodyMarkdown: '', visibility: commentForm.visibility });
      await refresh();
    }
  };

  const updateComment = async (event) => {
    event.preventDefault();
    if (!commentEdit) {
      return;
    }
    if (!(canUpdateWorkItems || commentEdit.authorId === currentUserId)) {
      action.setError('Your current project role cannot update this comment');
      return;
    }
    const updated = await action.run(
      () => context.services.workItems.updateComment(item.id, commentEdit.id, {
        bodyMarkdown: commentEdit.bodyMarkdown,
        visibility: commentEdit.visibility,
      }),
      'Comment updated',
    );
    if (updated) {
      setCommentEdit(null);
      await refresh();
    }
  };

  const deleteComment = async (commentId) => {
    const comment = collaboration.comments.find((entry) => entry.id === commentId);
    if (!(canUpdateWorkItems || comment?.authorId === currentUserId)) {
      action.setError('Your current project role cannot delete this comment');
      return;
    }
    await action.run(() => context.services.workItems.deleteComment(item.id, commentId), 'Comment deleted');
    await refresh();
  };

  const createLink = async (event) => {
    event.preventDefault();
    if (!canLink) {
      action.setError('Your current project role cannot create links');
      return;
    }
    const linkType = linkForm.linkType === 'custom' ? linkForm.customLinkType : linkForm.linkType;
    const created = await action.run(
      () => context.services.workItems.createLink(item.id, {
        targetWorkItemId: linkForm.targetWorkItemId,
        linkType,
      }),
      'Link added',
    );
    if (created) {
      setLinkForm({ targetWorkItemId: '', linkType: 'relates_to', customLinkType: '' });
      await refresh();
    }
  };

  const deleteLink = async (linkId) => {
    if (!canLink) {
      action.setError('Your current project role cannot delete links');
      return;
    }
    await action.run(() => context.services.workItems.deleteLink(item.id, linkId), 'Link removed');
    await refresh();
  };

  const addWatcher = async () => {
    if (!canReadWorkItems || !currentUserId) {
      action.setError('Your current project role cannot add watchers');
      return;
    }
    const watcher = await action.run(
      () => context.services.workItems.addWatcher(item.id, currentUserId ? { userId: currentUserId } : {}),
      'Watcher added',
    );
    if (watcher) {
      await refresh();
    }
  };

  const removeSelfWatcher = async () => {
    if (!canReadWorkItems || !currentUserId) {
      action.setError('Your current project role cannot remove watchers');
      return;
    }
    await action.run(() => context.services.workItems.removeWatcher(item.id, currentUserId), 'Watcher removed');
    await refresh();
  };

  const createWorkLog = async (event) => {
    event.preventDefault();
    if (!canCreateOwnWorkLogs) {
      action.setError('Your current project role cannot create work logs');
      return;
    }
    const created = await action.run(
      () => context.services.workItems.createWorkLog(item.id, workLogRequest(workLogForm, currentUserId)),
      'Work logged',
    );
    if (created) {
      setWorkLogForm({ minutesSpent: '30', workDate: today(), descriptionMarkdown: '' });
      await refresh();
    }
  };

  const updateWorkLog = async (event) => {
    event.preventDefault();
    if (!workLogEdit) {
      return;
    }
    if (!(canUpdateWorkItems || (canUpdateOwnWorkLogs && workLogEdit.userId === currentUserId))) {
      action.setError('Your current project role cannot update this work log');
      return;
    }
    const updated = await action.run(
      () => context.services.workItems.updateWorkLog(item.id, workLogEdit.id, workLogRequest(workLogEdit, currentUserId)),
      'Work log updated',
    );
    if (updated) {
      setWorkLogEdit(null);
      await refresh();
    }
  };

  const deleteWorkLog = async (workLogId) => {
    const workLog = collaboration.workLogs.find((entry) => entry.id === workLogId);
    if (!(canUpdateWorkItems || (canDeleteOwnWorkLogs && workLog?.userId === currentUserId))) {
      action.setError('Your current project role cannot delete this work log');
      return;
    }
    await action.run(() => context.services.workItems.deleteWorkLog(item.id, workLogId), 'Work log deleted');
    await refresh();
  };

  const createWorkspaceLabel = async (event) => {
    event.preventDefault();
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot manage labels');
      return;
    }
    const created = await action.run(
      () => context.services.workItems.createWorkspaceLabel(workspaceId, labelForm),
      'Label created',
    );
    if (created) {
      setLabelForm({ name: '', color: labelForm.color });
      setLabelId(created.id);
      await refresh();
    }
  };

  const addLabel = async (event) => {
    event.preventDefault();
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot manage labels');
      return;
    }
    const created = await action.run(
      () => context.services.workItems.addLabel(item.id, { labelId }),
      'Label added',
    );
    if (created) {
      setLabelId('');
      await refresh();
    }
  };

  const removeLabel = async (removeLabelId) => {
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot manage labels');
      return;
    }
    await action.run(() => context.services.workItems.removeLabel(item.id, removeLabelId), 'Label removed');
    await refresh();
  };

  const deleteWorkspaceLabel = async (deleteLabelId) => {
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot manage labels');
      return;
    }
    await action.run(() => context.services.workItems.deleteWorkspaceLabel(workspaceId, deleteLabelId), 'Workspace label deleted');
    await refresh();
  };

  const uploadFiles = async (fileList) => {
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot upload attachments');
      return;
    }
    const [file] = Array.from(fileList || []);
    if (!file) {
      return;
    }
    const uploaded = await action.run(
      () => context.services.workItems.uploadAttachment(item.id, {
        checksum: attachmentForm.checksum,
        file,
        visibility: attachmentForm.visibility,
      }),
      'Attachment uploaded',
    );
    if (uploaded) {
      setAttachmentForm({ checksum: '', visibility: attachmentForm.visibility });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refresh();
    }
  };

  const downloadAttachment = async (attachment) => {
    const blob = await action.run(
      () => context.services.workItems.downloadAttachment(item.id, attachment.id),
      'Attachment downloaded',
    );
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename || 'trasck-attachment';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const deleteAttachment = async (attachmentId) => {
    if (!canUpdateWorkItems) {
      action.setError('Your current project role cannot delete attachments');
      return;
    }
    await action.run(() => context.services.workItems.deleteAttachment(item.id, attachmentId), 'Attachment deleted');
    await refresh();
  };

  const itemLabel = (workItemId) => {
    const row = workItemById.get(workItemId);
    return row ? `${row.key || 'Item'} ${row.title || ''}`.trim() : 'Linked work item';
  };

  if (!item) {
    return <EmptyState label="Select a work item to review details" />;
  }

  return (
    <div className="work-detail">
      <div className="detail-toolbar">
        <div>
          <h2>{item.key || 'Work item'} {item.title}</h2>
          <p className="detail-subtitle">{item.descriptionMarkdown || 'No description'}</p>
        </div>
        <button className="secondary-button" disabled={action.pending} onClick={refresh} type="button">
          <FiRefreshCw />
          Refresh detail
        </button>
      </div>

      <SummaryRows rows={[
        ['Type', item.typeKey || 'Configured type'],
        ['Visibility', item.visibility],
        ['Estimate', item.estimatePoints || item.estimateMinutes],
        ['Remaining', item.remainingMinutes],
      ]} />

      <ErrorLine message={action.error} />

      <div className="collaboration-grid">
        <section className="collaboration-section">
          <h3><FiMessageSquare />Comments</h3>
          <form className="stack" onSubmit={createComment}>
            <Field label="Comment">
              <textarea value={commentForm.bodyMarkdown} onChange={(event) => setCommentForm({ ...commentForm, bodyMarkdown: event.target.value })} rows={3} />
            </Field>
            <SelectField label="Comment visibility" value={commentForm.visibility} onChange={(visibility) => setCommentForm({ ...commentForm, visibility })} options={commentVisibilityOptions} />
            <button className="primary-button" disabled={action.pending || !commentForm.bodyMarkdown.trim()} type="submit">
              <FiPlus />
              Add comment
            </button>
          </form>
          <RecordStack emptyLabel="No comments">
            {collaboration.comments.map((comment) => (
              <article className="record-card" key={comment.id}>
                {commentEdit?.id === comment.id ? (
                  <form className="stack" onSubmit={updateComment}>
                    <Field label="Edit comment">
                      <textarea value={commentEdit.bodyMarkdown} onChange={(event) => setCommentEdit({ ...commentEdit, bodyMarkdown: event.target.value })} rows={3} />
                    </Field>
                    <SelectField label="Edit comment visibility" value={commentEdit.visibility} onChange={(visibility) => setCommentEdit({ ...commentEdit, visibility })} options={commentVisibilityOptions} />
                    <div className="button-row wrap">
                      <button className="primary-button" disabled={action.pending || !commentEdit.bodyMarkdown.trim()} type="submit">Save edit</button>
                      <button className="secondary-button" disabled={action.pending} onClick={() => setCommentEdit(null)} type="button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="record-body">{comment.bodyMarkdown}</div>
                    <RecordMeta values={[comment.visibility, comment.createdAt]} />
                    <div className="button-row wrap">
                      <button className="icon-button" aria-label="Edit comment" disabled={action.pending} onClick={() => setCommentEdit(comment)} type="button"><FiEdit2 /></button>
                      <button className="icon-button danger" aria-label="Delete comment" disabled={action.pending} onClick={() => deleteComment(comment.id)} type="button"><FiTrash2 /></button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </RecordStack>
        </section>

        <section className="collaboration-section">
          <h3><FiLink />Links</h3>
          <form className="stack" onSubmit={createLink}>
            <Field label="Target work item">
              <select value={linkForm.targetWorkItemId} onChange={(event) => setLinkForm({ ...linkForm, targetWorkItemId: event.target.value })}>
                <option value="">Select a work item</option>
                {workItemOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.key || 'Item'} {option.title}</option>
                ))}
              </select>
            </Field>
            <SelectField label="Link type" value={linkForm.linkType} onChange={(linkType) => setLinkForm({ ...linkForm, linkType })} options={linkTypeOptions} />
            {linkForm.linkType === 'custom' ? (
              <TextField label="Custom link type" value={linkForm.customLinkType} onChange={(customLinkType) => setLinkForm({ ...linkForm, customLinkType })} />
            ) : null}
            <button className="primary-button" disabled={action.pending || !linkForm.targetWorkItemId || !selectedLinkType(linkForm)} type="submit">
              <FiPlus />
              Add link
            </button>
          </form>
          <RecordStack emptyLabel="No links">
            {collaboration.links.map((link) => (
              <article className="record-card" key={link.id}>
                <div className="record-body">
                  {itemLabel(link.sourceWorkItemId)} <span className="muted-text">{link.linkType}</span> {itemLabel(link.targetWorkItemId)}
                </div>
                <div className="button-row wrap">
                  <button className="icon-button danger" aria-label="Delete link" disabled={action.pending} onClick={() => deleteLink(link.id)} type="button"><FiTrash2 /></button>
                </div>
              </article>
            ))}
          </RecordStack>
        </section>

        <section className="collaboration-section">
          <h3><FiWatch />Watchers</h3>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || watchingSelf} onClick={addWatcher} type="button">
              <FiUserCheck />
              Watch yourself
            </button>
            <button className="secondary-button danger" disabled={action.pending || !currentUserId || !watchingSelf} onClick={removeSelfWatcher} type="button">
              Stop watching
            </button>
          </div>
          <RecordStack emptyLabel="No watchers">
            {collaboration.watchers.map((watcher) => (
              <article className="record-card compact-record" key={watcher.userId}>
                <div className="record-body">{watcher.userId === currentUserId ? currentUserName : 'Workspace member'}</div>
                <RecordMeta values={[watcher.createdAt]} />
              </article>
            ))}
          </RecordStack>
        </section>

        <section className="collaboration-section">
          <h3><FiEdit2 />Work Logs</h3>
          <form className="stack" onSubmit={createWorkLog}>
            <div className="two-column compact">
              <TextField label="Minutes" type="number" value={workLogForm.minutesSpent} onChange={(minutesSpent) => setWorkLogForm({ ...workLogForm, minutesSpent })} />
              <TextField label="Work date" type="date" value={workLogForm.workDate} onChange={(workDate) => setWorkLogForm({ ...workLogForm, workDate })} />
            </div>
            <Field label="Work log description">
              <textarea value={workLogForm.descriptionMarkdown} onChange={(event) => setWorkLogForm({ ...workLogForm, descriptionMarkdown: event.target.value })} rows={2} />
            </Field>
            <button className="primary-button" disabled={action.pending || !positiveMinuteValue(workLogForm.minutesSpent)} type="submit">
              <FiPlus />
              Log work
            </button>
          </form>
          <RecordStack emptyLabel="No work logs">
            {collaboration.workLogs.map((workLog) => (
              <article className="record-card" key={workLog.id}>
                {workLogEdit?.id === workLog.id ? (
                  <form className="stack" onSubmit={updateWorkLog}>
                    <div className="two-column compact">
                      <TextField label="Edit minutes" type="number" value={workLogEdit.minutesSpent} onChange={(minutesSpent) => setWorkLogEdit({ ...workLogEdit, minutesSpent })} />
                      <TextField label="Edit work date" type="date" value={workLogEdit.workDate} onChange={(workDate) => setWorkLogEdit({ ...workLogEdit, workDate })} />
                    </div>
                    <Field label="Edit work log description">
                      <textarea value={workLogEdit.descriptionMarkdown} onChange={(event) => setWorkLogEdit({ ...workLogEdit, descriptionMarkdown: event.target.value })} rows={2} />
                    </Field>
                    <div className="button-row wrap">
                      <button className="primary-button" disabled={action.pending || !positiveMinuteValue(workLogEdit.minutesSpent)} type="submit">Save work log</button>
                      <button className="secondary-button" disabled={action.pending} onClick={() => setWorkLogEdit(null)} type="button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="record-body">{workLog.minutesSpent} minutes on {workLog.workDate}</div>
                    <p className="record-copy">{workLog.descriptionMarkdown || 'No description'}</p>
                    <div className="button-row wrap">
                      <button className="icon-button" aria-label="Edit work log" disabled={action.pending} onClick={() => setWorkLogEdit(workLogDraft(workLog))} type="button"><FiEdit2 /></button>
                      <button className="icon-button danger" aria-label="Delete work log" disabled={action.pending} onClick={() => deleteWorkLog(workLog.id)} type="button"><FiTrash2 /></button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </RecordStack>
        </section>

        <section className="collaboration-section">
          <h3><FiTag />Labels</h3>
          <form className="stack" onSubmit={createWorkspaceLabel}>
            <div className="two-column compact">
              <TextField label="Label name" value={labelForm.name} onChange={(name) => setLabelForm({ ...labelForm, name })} />
              <Field label="Label color">
                <input type="color" value={labelForm.color} onChange={(event) => setLabelForm({ ...labelForm, color: event.target.value })} />
              </Field>
            </div>
            <button className="secondary-button" disabled={action.pending || !workspaceId || !labelForm.name.trim()} type="submit">
              <FiPlus />
              Create label
            </button>
          </form>
          <form className="stack" onSubmit={addLabel}>
            <Field label="Workspace label">
              <select value={labelId} onChange={(event) => setLabelId(event.target.value)}>
                <option value="">Select a label</option>
                {unattachedLabels.map((label) => (
                  <option key={label.id} value={label.id}>{label.name}</option>
                ))}
              </select>
            </Field>
            <button className="primary-button" disabled={action.pending || !labelId} type="submit">
              <FiPlus />
              Add label
            </button>
          </form>
          <RecordStack emptyLabel="No labels">
            {collaboration.labels.map((label) => (
              <article className="label-chip-row" key={label.id}>
                <span className="label-chip" style={{ '--label-color': label.color || '#2a7a8c' }}>{label.name}</span>
                <button className="icon-button danger" aria-label="Remove label" disabled={action.pending} onClick={() => removeLabel(label.id)} type="button"><FiTrash2 /></button>
              </article>
            ))}
          </RecordStack>
          <details className="workspace-labels">
            <summary>Workspace labels</summary>
            <RecordStack emptyLabel="No workspace labels">
              {collaboration.workspaceLabels.map((label) => (
                <article className="label-chip-row" key={label.id}>
                  <span className="label-chip" style={{ '--label-color': label.color || '#2a7a8c' }}>{label.name}</span>
                  <button className="icon-button danger" aria-label="Delete workspace label" disabled={action.pending || attachedLabelIds.has(label.id)} onClick={() => deleteWorkspaceLabel(label.id)} type="button"><FiTrash2 /></button>
                </article>
              ))}
            </RecordStack>
          </details>
        </section>

        <section className="collaboration-section">
          <h3><FiPaperclip />Attachments</h3>
          <div
            className={`attachment-drop-zone${draggingFile ? ' attachment-drop-zone-active' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDraggingFile(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDraggingFile(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDraggingFile(false);
              uploadFiles(event.dataTransfer.files);
            }}
          >
            <div className="two-column compact">
              <SelectField label="Attachment visibility" value={attachmentForm.visibility} onChange={(visibility) => setAttachmentForm({ ...attachmentForm, visibility })} options={attachmentVisibilityOptions} />
              <TextField label="Attachment checksum" value={attachmentForm.checksum} onChange={(checksum) => setAttachmentForm({ ...attachmentForm, checksum })} />
            </div>
            <Field label="Attachment file">
              <input ref={fileInputRef} type="file" onChange={(event) => uploadFiles(event.target.files)} />
            </Field>
            <p className="drop-zone-copy">Drop a file here or choose one from your device.</p>
          </div>
          <RecordStack emptyLabel="No attachments">
            {collaboration.attachments.map((attachment) => (
              <article className="record-card" key={attachment.id}>
                <div className="record-body">{attachment.filename}</div>
                <RecordMeta values={[attachment.visibility, attachment.contentType, `${attachment.sizeBytes || 0} bytes`]} />
                <div className="button-row wrap">
                  <button className="secondary-button" disabled={action.pending} onClick={() => downloadAttachment(attachment)} type="button">
                    <FiDownload />
                    Download
                  </button>
                  <button className="icon-button danger" aria-label="Delete attachment" disabled={action.pending} onClick={() => deleteAttachment(attachment.id)} type="button"><FiTrash2 /></button>
                </div>
              </article>
            ))}
          </RecordStack>
        </section>

        <section className="collaboration-section">
          <h3><FiRefreshCw />Activity</h3>
          <RecordStack emptyLabel="No activity loaded">
            {collaboration.activity.map((event) => (
              <article className="record-card compact-record" key={event.id}>
                <div className="record-body">{event.eventType}</div>
                <RecordMeta values={[event.entityType, event.createdAt]} />
              </article>
            ))}
          </RecordStack>
        </section>
      </div>
    </div>
  );
};

const RecordStack = ({ children, emptyLabel }) => {
  const childArray = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return (
    <div className="record-stack">
      {childArray.length === 0 ? <EmptyState label={emptyLabel} /> : childArray}
    </div>
  );
};

const RecordMeta = ({ values }) => (
  <div className="record-meta">
    {values.filter(Boolean).map((value) => (
      <span key={String(value)}>{String(value)}</span>
    ))}
  </div>
);

const selectedLinkType = (linkForm) => (
  linkForm.linkType === 'custom' ? linkForm.customLinkType.trim() : linkForm.linkType
);

const positiveMinuteValue = (value) => Number.parseInt(value, 10) > 0;

const workLogRequest = (draft, currentUserId) => ({
  descriptionMarkdown: draft.descriptionMarkdown || '',
  minutesSpent: Number.parseInt(draft.minutesSpent, 10),
  userId: currentUserId || undefined,
  workDate: draft.workDate || today(),
});

const workLogDraft = (workLog) => ({
  id: workLog.id,
  descriptionMarkdown: workLog.descriptionMarkdown || '',
  minutesSpent: String(workLog.minutesSpent || 30),
  workDate: workLog.workDate || today(),
});
