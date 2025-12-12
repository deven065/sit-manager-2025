import { z } from 'zod';

export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

export function validate(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

export async function validateAsync(schema, data) {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

export function createValidator(schema) {
  return (data) => validate(schema, data);
}

export async function validateRequest(request, schema) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    } else {
      data = {};
    }

    return validate(schema, data);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError([{ message: 'Invalid request format' }]);
  }
}

export function withValidation(handler, schema) {
  return async (request, context) => {
    const data = await validateRequest(request, schema);
    return handler(request, { ...context, body: data });
  };
}

export const commonSchemas = {
  email: z.string().email(),
  password: z.string().min(8).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  url: z.string().url(),
  uuid: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  dateString: z.string().datetime(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().nonnegative(),
};

export const sanitize = {
  string: (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 10000);
  },

  email: (email) => {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  },

  html: (html) => {
    if (typeof html !== 'string') return html;
    return html
      .replace(/[<>'"]/g, (char) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        };
        return entities[char];
      });
  },

  sql: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, '');
  },

  alphanumeric: (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[^a-zA-Z0-9]/g, '');
  },
};

export function createSanitizedSchema(schema, sanitizers = {}) {
  return z.preprocess((data) => {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    for (const [key, sanitizer] of Object.entries(sanitizers)) {
      if (key in sanitized && typeof sanitizer === 'function') {
        sanitized[key] = sanitizer(sanitized[key]);
      }
    }
    return sanitized;
  }, schema);
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  filters: z.record(z.string()).optional(),
});
