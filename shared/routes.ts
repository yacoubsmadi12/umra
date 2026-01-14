import { z } from 'zod';
import { insertUserSchema, insertUmrahRequestSchema, users, umrahRequests, tripMaterials } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        employeeId: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  requests: {
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: z.object({
        checklistCompleted: z.boolean(),
      }),
      responses: {
        201: z.custom<typeof umrahRequests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: { // Admin only
      method: 'GET' as const,
      path: '/api/requests',
      responses: {
        200: z.array(z.custom<typeof umrahRequests.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    myRequest: { // Current user's request
      method: 'GET' as const,
      path: '/api/requests/me',
      responses: {
        200: z.custom<typeof umrahRequests.$inferSelect>().nullable(),
      },
    },
    update: { // For user (payment, passport) and Admin (status, visa, ticket)
      method: 'PATCH' as const,
      path: '/api/requests/:id',
      input: z.object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        paymentMethod: z.enum(['salary_deduction', 'entertainment_allowance', 'cash', 'cliQ']).optional(),
        passportUrl: z.string().optional(),
        visaUrl: z.string().optional(),
        ticketUrl: z.string().optional(),
        adminComments: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof umrahRequests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  materials: {
    list: {
      method: 'GET' as const,
      path: '/api/materials',
      responses: {
        200: z.array(z.custom<typeof tripMaterials.$inferSelect>()),
      },
    }
  },
  colleagues: {
    list: {
      method: 'GET' as const,
      path: '/api/colleagues',
      responses: {
        200: z.array(z.object({
          fullName: z.string(),
          department: z.string(),
          gender: z.string()
        })),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
