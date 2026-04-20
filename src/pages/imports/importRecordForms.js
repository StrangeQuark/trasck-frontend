import { toJsonText } from '../../utils/forms';

export const importRecordToForm = (record = null) => ({
  recordId: record?.id || '',
  sourceType: record?.sourceType || '',
  sourceId: record?.sourceId || '',
  targetType: record?.targetType || '',
  targetId: record?.targetId || '',
  clearTarget: 'false',
  status: record?.status || 'pending',
  errorMessage: record?.errorMessage || '',
  rawPayloadText: toJsonText(record?.rawPayload || {}),
});

export const importRecordFormToRequest = (form, parseJson) => ({
  sourceType: form.sourceType,
  sourceId: form.sourceId,
  targetType: form.clearTarget === 'true' ? undefined : form.targetType || undefined,
  targetId: form.clearTarget === 'true' ? undefined : form.targetId || undefined,
  clearTarget: form.clearTarget === 'true',
  status: form.status || undefined,
  errorMessage: form.errorMessage || undefined,
  rawPayload: parseJson(form.rawPayloadText),
});
