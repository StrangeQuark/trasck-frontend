import { numberOrUndefined } from './forms';

export const DEFAULT_POLICY_FORM = {
  anonymousReadEnabled: false,
  visibility: '',
  attachmentMaxUploadBytes: '',
  attachmentMaxDownloadBytes: '',
  attachmentAllowedContentTypes: '',
  exportMaxArtifactBytes: '',
  exportAllowedContentTypes: '',
  importMaxParseBytes: '',
  importAllowedContentTypes: '',
};

export const policyToForm = (policy) => ({
  anonymousReadEnabled: Boolean(policy?.anonymousReadEnabled),
  visibility: policy?.visibility || '',
  attachmentMaxUploadBytes: valueText(policy?.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: valueText(policy?.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: policy?.attachmentAllowedContentTypes || '',
  exportMaxArtifactBytes: valueText(policy?.exportMaxArtifactBytes),
  exportAllowedContentTypes: policy?.exportAllowedContentTypes || '',
  importMaxParseBytes: valueText(policy?.importMaxParseBytes),
  importAllowedContentTypes: policy?.importAllowedContentTypes || '',
});

const contentPolicyRequest = (form) => ({
  attachmentMaxUploadBytes: numberOrUndefined(form.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: numberOrUndefined(form.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: form.attachmentAllowedContentTypes || undefined,
  exportMaxArtifactBytes: numberOrUndefined(form.exportMaxArtifactBytes),
  exportAllowedContentTypes: form.exportAllowedContentTypes || undefined,
  importMaxParseBytes: numberOrUndefined(form.importMaxParseBytes),
  importAllowedContentTypes: form.importAllowedContentTypes || undefined,
});

export const workspacePolicyRequest = (form) => ({
  anonymousReadEnabled: Boolean(form.anonymousReadEnabled),
  ...contentPolicyRequest(form),
});

export const projectPolicyRequest = (form) => ({
  visibility: form.visibility || undefined,
  ...contentPolicyRequest(form),
});

export const policyRequest = (form) => ({
  anonymousReadEnabled: form.anonymousReadEnabled === undefined ? undefined : Boolean(form.anonymousReadEnabled),
  visibility: form.visibility || undefined,
  ...contentPolicyRequest(form),
});

const valueText = (value) => value === undefined || value === null ? '' : String(value);
