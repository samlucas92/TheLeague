import { apiRequest, postJson } from './api';
import type { EmailAuditItem, SiteUserAdminItem } from './types';

export const adminService = {
	emails: () => apiRequest<EmailAuditItem[]>('/admin/emails'),
	retryEmail: (emailId: string) => postJson('/admin/emails/' + emailId + '/retry'),
	users: () => apiRequest<SiteUserAdminItem[]>('/admin/users'),
	setSiteAdmin: (userId: string, isSiteAdmin: boolean) =>
		apiRequest<SiteUserAdminItem>(`/admin/users/${userId}/site-admin`, {
			method: 'PUT',
			body: JSON.stringify({ isSiteAdmin })
		})
};
