import type { WorkflowTemplate } from '@/types/platform'

export const stubTemplates: WorkflowTemplate[] = [
  { templateId: 'tpl_001', name: 'CRM Contact Sync', description: 'Sync contacts from any CRM to your data warehouse on a schedule.', category: 'crm', connectors: ['Salesforce', 'BigQuery'], usageCount: 2340, featured: true },
  { templateId: 'tpl_002', name: 'Payment Pipeline', description: 'Capture Stripe events and route them to your analytics platform.', category: 'finance', connectors: ['Stripe', 'Segment'], usageCount: 1870, featured: true },
  { templateId: 'tpl_003', name: 'Lead Enrichment', description: 'Enrich inbound HubSpot leads with company data automatically.', category: 'marketing', connectors: ['HubSpot', 'Clearbit'], usageCount: 980, featured: false },
  { templateId: 'tpl_004', name: 'Error Alert Pipeline', description: 'Capture application errors and route alerts to Slack and PagerDuty.', category: 'devops', connectors: ['Datadog', 'Slack', 'PagerDuty'], usageCount: 645, featured: false },
  { templateId: 'tpl_005', name: 'Marketing Attribution', description: 'Join ad spend data with CRM revenue for ROI reporting.', category: 'analytics', connectors: ['Google Ads', 'Salesforce', 'BigQuery'], usageCount: 412, featured: false },
]
