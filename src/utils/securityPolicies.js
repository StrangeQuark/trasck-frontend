import { numberOrUndefined } from './forms';

export const DEFAULT_POLICY_FORM = {
  attachmentMaxUploadBytes: '',
  attachmentMaxDownloadBytes: '',
  attachmentAllowedContentTypes: '',
  exportMaxArtifactBytes: '',
  exportAllowedContentTypes: '',
  importMaxParseBytes: '',
  importAllowedContentTypes: '',
};

export const policyToForm = (policy) => ({
  attachmentMaxUploadBytes: valueText(policy?.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: valueText(policy?.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: policy?.attachmentAllowedContentTypes || '',
  exportMaxArtifactBytes: valueText(policy?.exportMaxArtifactBytes),
  exportAllowedContentTypes: policy?.exportAllowedContentTypes || '',
  importMaxParseBytes: valueText(policy?.importMaxParseBytes),
  importAllowedContentTypes: policy?.importAllowedContentTypes || '',
});

export const policyRequest = (form) => ({
  attachmentMaxUploadBytes: numberOrUndefined(form.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: numberOrUndefined(form.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: form.attachmentAllowedContentTypes || undefined,
  exportMaxArtifactBytes: numberOrUndefined(form.exportMaxArtifactBytes),
  exportAllowedContentTypes: form.exportAllowedContentTypes || undefined,
  importMaxParseBytes: numberOrUndefined(form.importMaxParseBytes),
  importAllowedContentTypes: form.importAllowedContentTypes || undefined,
});

const valueText = (value) => value === undefined || value === null ? '' : String(value);
