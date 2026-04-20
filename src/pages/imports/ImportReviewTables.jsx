import { FiDownload } from 'react-icons/fi';

const asRows = (value) => (Array.isArray(value) ? value : value?.items || []);

const formatValue = (value) => {
  if (value === undefined) {
    return '';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  return ['completed', 'succeeded', 'sent'].includes(normalized) ? 'status-pill active' : 'status-pill';
};

export const EmptyTableState = ({ message = 'No rows loaded' }) => (
  <div className="empty-state compact-empty">{message}</div>
);

export const ImportRecordVersionDiffTable = ({ diffs = [] }) => {
  const rows = diffs.flatMap((diff) => (diff.fields || []).map((field) => ({
    key: `${diff.versionId || diff.version}-${field.path}`,
    version: diff.version,
    comparedToVersion: diff.comparedToVersion,
    changeType: field.changeType || diff.changeType,
    path: field.path,
    previousValue: field.previousValue,
    value: field.value,
    createdAt: diff.createdAt,
  })));
  if (rows.length === 0) {
    return <EmptyTableState message="No record field diffs loaded" />;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Change</th>
            <th>Field</th>
            <th>Previous</th>
            <th>Current</th>
            <th>Changed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.comparedToVersion ? `${row.comparedToVersion} -> ${row.version}` : row.version}</td>
              <td>{row.changeType}</td>
              <td className="mono-cell">{row.path}</td>
              <td className="truncate-cell">{formatValue(row.previousValue)}</td>
              <td className="truncate-cell">{formatValue(row.value)}</td>
              <td>{formatDate(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ImportJobVersionDiffTable = ({ diffs }) => {
  const records = diffs?.records || [];
  const rows = records.flatMap((record) => (record.diffs || []).flatMap((diff) => (diff.fields || []).map((field) => ({
    key: `${record.recordId}-${diff.versionId || diff.version}-${field.path}`,
    source: [record.sourceType, record.sourceId].filter(Boolean).join(' / '),
    status: record.status,
    conflictStatus: record.conflictStatus,
    version: diff.version,
    comparedToVersion: diff.comparedToVersion,
    changeType: field.changeType || diff.changeType,
    path: field.path,
    previousValue: field.previousValue,
    value: field.value,
  }))));
  if (rows.length === 0) {
    return <EmptyTableState message="No job field diffs loaded" />;
  }
  return (
    <div className="stack">
      <dl className="summary-rows">
        <div><dt>Records</dt><dd>{diffs?.recordCount ?? 0}</dd></div>
        <div><dt>Versions</dt><dd>{diffs?.versionCount ?? 0}</dd></div>
        <div><dt>Diffs</dt><dd>{diffs?.diffCount ?? 0}</dd></div>
      </dl>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
              <th>Version</th>
              <th>Change</th>
              <th>Field</th>
              <th>Previous</th>
              <th>Current</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.source}</td>
                <td><span className={statusClass(row.conflictStatus || row.status)}>{row.conflictStatus || row.status}</span></td>
                <td>{row.comparedToVersion ? `${row.comparedToVersion} -> ${row.version}` : row.version}</td>
                <td>{row.changeType}</td>
                <td className="mono-cell">{row.path}</td>
                <td className="truncate-cell">{formatValue(row.previousValue)}</td>
                <td className="truncate-cell">{formatValue(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ImportConflictResolutionJobsTable = ({ jobs = [] }) => {
  const rows = asRows(jobs);
  if (rows.length === 0) {
    return <EmptyTableState message="No conflict-resolution jobs loaded" />;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Resolution</th>
            <th>Scope</th>
            <th>Filters</th>
            <th>Counts</th>
            <th>Requested</th>
            <th>Finished</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((job) => (
            <tr key={job.id}>
              <td><span className={statusClass(job.status)}>{job.status}</span></td>
              <td>{job.resolution}</td>
              <td>{job.scope}</td>
              <td className="truncate-cell">
                {[
                  job.statusFilter && `status=${job.statusFilter}`,
                  job.conflictStatusFilter && `conflict=${job.conflictStatusFilter}`,
                  job.sourceTypeFilter && `source=${job.sourceTypeFilter}`,
                ].filter(Boolean).join(', ')}
              </td>
              <td>{job.resolvedCount ?? 0}/{job.matchedCount ?? job.expectedCount ?? 0} resolved, {job.failedCount ?? 0} failed</td>
              <td>{formatDate(job.requestedAt)}</td>
              <td>{formatDate(job.finishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ImportExportJobsTable = ({ jobs = [], onDownload }) => {
  const rows = asRows(jobs);
  if (rows.length === 0) {
    return <EmptyTableState message="No import diff export artifacts loaded" />;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Filename</th>
            <th>Size</th>
            <th>Finished</th>
            <th>Checksum</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((job) => (
            <tr key={job.id}>
              <td><span className={statusClass(job.status)}>{job.status}</span></td>
              <td className="truncate-cell">{job.filename}</td>
              <td>{job.sizeBytes ?? 0}</td>
              <td>{formatDate(job.finishedAt)}</td>
              <td className="mono-cell truncate-cell">{job.checksum}</td>
              <td>
                <button className="icon-button" disabled={!job.id || !onDownload} onClick={() => onDownload(job)} title="Download export artifact" type="button">
                  <FiDownload />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ImportCompletionMetricsTable = ({ title = 'Import Completion', metrics }) => {
  if (!metrics) {
    return <EmptyTableState message={`${title} metrics not loaded`} />;
  }
  return (
    <div className="table-wrap">
      <table className="data-table metrics-table">
        <thead>
          <tr>
            <th>Scope</th>
            <th>Completed</th>
            <th>Completed With Open Conflicts</th>
            <th>Accepted Open Conflicts</th>
            <th>Last Accepted</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{title}</td>
            <td>{metrics.completedJobs ?? 0}</td>
            <td>{metrics.completedWithOpenConflicts ?? 0}</td>
            <td>{metrics.acceptedOpenConflictCount ?? 0}</td>
            <td>{formatDate(metrics.lastOpenConflictCompletedAt)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
