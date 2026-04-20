import { useMemo, useState } from 'react';
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

const filterRows = (rows, columns, filterColumn, query) => {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) {
    return rows;
  }
  const activeColumns = filterColumn === 'all'
    ? columns
    : columns.filter((column) => column.key === filterColumn);
  return rows.filter((row) => activeColumns.some((column) => String(column.csv(row) ?? '').toLowerCase().includes(normalized)));
};

const csvValue = (value) => {
  const text = formatValue(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const downloadCsv = (filename, columns, rows) => {
  const csv = [
    columns.map((column) => csvValue(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => csvValue(column.csv(row))).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const TableControls = ({ columns, csvFilename, filter, filterColumn, onCsvExport, rows, setFilter, setFilterColumn }) => (
  <div className="table-actions">
    <label className="table-filter">
      <span>Column</span>
      <select value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)}>
        <option value="all">All columns</option>
        {columns.map((column) => (
          <option key={column.key} value={column.key}>{column.label}</option>
        ))}
      </select>
    </label>
    <label className="table-filter">
      <span>Filter</span>
      <input value={filter} onChange={(event) => setFilter(event.target.value)} />
    </label>
    <button className="secondary-button" disabled={rows.length === 0} onClick={() => (onCsvExport ? onCsvExport({ filter, filterColumn }) : downloadCsv(csvFilename, columns, rows))} type="button">
      <FiDownload />CSV
    </button>
  </div>
);

const useFilteredRows = (rows, columns) => {
  const [filterColumn, setFilterColumn] = useState('all');
  const [filter, setFilter] = useState('');
  const filteredRows = useMemo(
    () => filterRows(rows, columns, filterColumn, filter),
    [columns, filter, filterColumn, rows]
  );
  return { filter, filteredRows, filterColumn, setFilter, setFilterColumn };
};

export const EmptyTableState = ({ message = 'No rows loaded' }) => (
  <div className="empty-state compact-empty">{message}</div>
);

export const ImportRecordVersionDiffTable = ({ diffs = [] }) => {
  const rows = diffs.flatMap((diff) => (diff.fields || []).map((field) => ({
    key: `${diff.versionId || diff.version}-${field.path}`,
    version: diff.version,
    versionLabel: diff.comparedToVersion ? `${diff.comparedToVersion} -> ${diff.version}` : String(diff.version),
    changeType: field.changeType || diff.changeType,
    path: field.path,
    previousValue: field.previousValue,
    value: field.value,
    changedAt: formatDate(diff.createdAt),
  })));
  const columns = useMemo(() => [
    { key: 'versionLabel', label: 'Version', csv: (row) => row.versionLabel },
    { key: 'changeType', label: 'Change', csv: (row) => row.changeType },
    { key: 'path', label: 'Field', csv: (row) => row.path },
    { key: 'previousValue', label: 'Previous', csv: (row) => row.previousValue },
    { key: 'value', label: 'Current', csv: (row) => row.value },
    { key: 'changedAt', label: 'Changed', csv: (row) => row.changedAt },
  ], []);
  const { filter, filteredRows, filterColumn, setFilter, setFilterColumn } = useFilteredRows(rows, columns);

  if (rows.length === 0) {
    return <EmptyTableState message="No record field diffs loaded" />;
  }
  return (
    <div className="stack">
      <TableControls columns={columns} csvFilename="import-record-version-diffs.csv" filter={filter} filterColumn={filterColumn} rows={filteredRows} setFilter={setFilter} setFilterColumn={setFilterColumn} />
      {filteredRows.length === 0 ? <EmptyTableState message="No record field diffs match this filter" /> : (
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
              {filteredRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.versionLabel}</td>
                  <td>{row.changeType}</td>
                  <td className="mono-cell">{row.path}</td>
                  <td className="truncate-cell">{formatValue(row.previousValue)}</td>
                  <td className="truncate-cell">{formatValue(row.value)}</td>
                  <td>{row.changedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ImportJobVersionDiffTable = ({ diffs, onCsvExport }) => {
  const records = diffs?.records || [];
  const rows = records.flatMap((record) => (record.diffs || []).flatMap((diff) => (diff.fields || []).map((field) => ({
    key: `${record.recordId}-${diff.versionId || diff.version}-${field.path}`,
    source: [record.sourceType, record.sourceId].filter(Boolean).join(' / '),
    status: record.status,
    statusLabel: record.conflictStatus || record.status,
    versionLabel: diff.comparedToVersion ? `${diff.comparedToVersion} -> ${diff.version}` : String(diff.version),
    changeType: field.changeType || diff.changeType,
    path: field.path,
    previousValue: field.previousValue,
    value: field.value,
  }))));
  const columns = useMemo(() => [
    { key: 'source', label: 'Source', csv: (row) => row.source },
    { key: 'statusLabel', label: 'Status', csv: (row) => row.statusLabel },
    { key: 'versionLabel', label: 'Version', csv: (row) => row.versionLabel },
    { key: 'changeType', label: 'Change', csv: (row) => row.changeType },
    { key: 'path', label: 'Field', csv: (row) => row.path },
    { key: 'previousValue', label: 'Previous', csv: (row) => row.previousValue },
    { key: 'value', label: 'Current', csv: (row) => row.value },
  ], []);
  const { filter, filteredRows, filterColumn, setFilter, setFilterColumn } = useFilteredRows(rows, columns);

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
      <TableControls columns={columns} csvFilename="import-job-version-diffs.csv" filter={filter} filterColumn={filterColumn} onCsvExport={onCsvExport} rows={filteredRows} setFilter={setFilter} setFilterColumn={setFilterColumn} />
      {filteredRows.length === 0 ? <EmptyTableState message="No job field diffs match this filter" /> : (
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
              {filteredRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.source}</td>
                  <td><span className={statusClass(row.statusLabel)}>{row.statusLabel}</span></td>
                  <td>{row.versionLabel}</td>
                  <td>{row.changeType}</td>
                  <td className="mono-cell">{row.path}</td>
                  <td className="truncate-cell">{formatValue(row.previousValue)}</td>
                  <td className="truncate-cell">{formatValue(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ImportConflictResolutionJobsTable = ({ jobs = [] }) => {
  const rows = asRows(jobs).map((job) => ({
    ...job,
    filters: [
      job.statusFilter && `status=${job.statusFilter}`,
      job.conflictStatusFilter && `conflict=${job.conflictStatusFilter}`,
      job.sourceTypeFilter && `source=${job.sourceTypeFilter}`,
    ].filter(Boolean).join(', '),
    counts: `${job.resolvedCount ?? 0}/${job.matchedCount ?? job.expectedCount ?? 0} resolved, ${job.failedCount ?? 0} failed`,
    requestedAtLabel: formatDate(job.requestedAt),
    finishedAtLabel: formatDate(job.finishedAt),
  }));
  const columns = useMemo(() => [
    { key: 'status', label: 'Status', csv: (row) => row.status },
    { key: 'resolution', label: 'Resolution', csv: (row) => row.resolution },
    { key: 'scope', label: 'Scope', csv: (row) => row.scope },
    { key: 'filters', label: 'Filters', csv: (row) => row.filters },
    { key: 'counts', label: 'Counts', csv: (row) => row.counts },
    { key: 'requestedAtLabel', label: 'Requested', csv: (row) => row.requestedAtLabel },
    { key: 'finishedAtLabel', label: 'Finished', csv: (row) => row.finishedAtLabel },
  ], []);
  const { filter, filteredRows, filterColumn, setFilter, setFilterColumn } = useFilteredRows(rows, columns);

  if (rows.length === 0) {
    return <EmptyTableState message="No conflict-resolution jobs loaded" />;
  }
  return (
    <div className="stack">
      <TableControls columns={columns} csvFilename="import-conflict-resolution-jobs.csv" filter={filter} filterColumn={filterColumn} rows={filteredRows} setFilter={setFilter} setFilterColumn={setFilterColumn} />
      {filteredRows.length === 0 ? <EmptyTableState message="No conflict-resolution jobs match this filter" /> : (
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
              {filteredRows.map((job) => (
                <tr key={job.id}>
                  <td><span className={statusClass(job.status)}>{job.status}</span></td>
                  <td>{job.resolution}</td>
                  <td>{job.scope}</td>
                  <td className="truncate-cell">{job.filters}</td>
                  <td>{job.counts}</td>
                  <td>{job.requestedAtLabel}</td>
                  <td>{job.finishedAtLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ImportExportJobsTable = ({ jobs = [], onDownload }) => {
  const rows = asRows(jobs).map((job) => ({
    ...job,
    sizeLabel: String(job.sizeBytes ?? 0),
    finishedAtLabel: formatDate(job.finishedAt),
  }));
  const columns = useMemo(() => [
    { key: 'status', label: 'Status', csv: (row) => row.status },
    { key: 'filename', label: 'Filename', csv: (row) => row.filename },
    { key: 'sizeLabel', label: 'Size', csv: (row) => row.sizeLabel },
    { key: 'finishedAtLabel', label: 'Finished', csv: (row) => row.finishedAtLabel },
    { key: 'checksum', label: 'Checksum', csv: (row) => row.checksum },
  ], []);
  const { filter, filteredRows, filterColumn, setFilter, setFilterColumn } = useFilteredRows(rows, columns);

  if (rows.length === 0) {
    return <EmptyTableState message="No import diff export artifacts loaded" />;
  }
  return (
    <div className="stack">
      <TableControls columns={columns} csvFilename="import-diff-export-artifacts.csv" filter={filter} filterColumn={filterColumn} rows={filteredRows} setFilter={setFilter} setFilterColumn={setFilterColumn} />
      {filteredRows.length === 0 ? <EmptyTableState message="No import diff export artifacts match this filter" /> : (
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
              {filteredRows.map((job) => (
                <tr key={job.id}>
                  <td><span className={statusClass(job.status)}>{job.status}</span></td>
                  <td className="truncate-cell">{job.filename}</td>
                  <td>{job.sizeLabel}</td>
                  <td>{job.finishedAtLabel}</td>
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
      )}
    </div>
  );
};

export const ImportCompletionMetricsTable = ({ title = 'Import Completion', metrics }) => {
  const rows = metrics ? [{
    scope: title,
    completedJobs: metrics.completedJobs ?? 0,
    completedWithOpenConflicts: metrics.completedWithOpenConflicts ?? 0,
    acceptedOpenConflictCount: metrics.acceptedOpenConflictCount ?? 0,
    lastOpenConflictCompletedAt: formatDate(metrics.lastOpenConflictCompletedAt),
  }] : [];
  const columns = useMemo(() => [
    { key: 'scope', label: 'Scope', csv: (row) => row.scope },
    { key: 'completedJobs', label: 'Completed', csv: (row) => row.completedJobs },
    { key: 'completedWithOpenConflicts', label: 'Completed With Open Conflicts', csv: (row) => row.completedWithOpenConflicts },
    { key: 'acceptedOpenConflictCount', label: 'Accepted Open Conflicts', csv: (row) => row.acceptedOpenConflictCount },
    { key: 'lastOpenConflictCompletedAt', label: 'Last Accepted', csv: (row) => row.lastOpenConflictCompletedAt },
  ], []);
  const { filter, filteredRows, filterColumn, setFilter, setFilterColumn } = useFilteredRows(rows, columns);

  if (!metrics) {
    return <EmptyTableState message={`${title} metrics not loaded`} />;
  }
  return (
    <div className="stack">
      <TableControls columns={columns} csvFilename={`${title.toLowerCase().replaceAll(' ', '-')}-import-completion.csv`} filter={filter} filterColumn={filterColumn} rows={filteredRows} setFilter={setFilter} setFilterColumn={setFilterColumn} />
      {filteredRows.length === 0 ? <EmptyTableState message={`${title} metrics do not match this filter`} /> : (
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
              {filteredRows.map((row) => (
                <tr key={row.scope}>
                  <td>{row.scope}</td>
                  <td>{row.completedJobs}</td>
                  <td>{row.completedWithOpenConflicts}</td>
                  <td>{row.acceptedOpenConflictCount}</td>
                  <td>{row.lastOpenConflictCompletedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
