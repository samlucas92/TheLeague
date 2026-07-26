import { apiRequest, postJson } from './api';
import type { EmailAuditItem } from './types';

export const adminService = {
	emails: () => apiRequest<EmailAuditItem[]>('/admin/emails'),
	retryEmail: (emailId: string) => postJson('/admin/emails/' + emailId + '/retry')
};
