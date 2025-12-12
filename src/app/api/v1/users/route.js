import { 
  withErrorHandler,
  withRateLimit,
  withValidation,
  createAPIHandler,
  securityMiddleware,
  corsMiddleware,
  createRequestLogger,
  createPerformanceMonitor,
  requireAuth,
  requireRole,
  jsonResponse,
  successResponse,
  BadRequestError,
  NotFoundError,
  z,
} from '@/lib/backend';

export async function GET(request) {
  return jsonResponse(
    successResponse({ message: 'User API endpoint' })
  );
}

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = userSchema.parse(body);
    
    return jsonResponse(
      successResponse({ 
        message: 'User created',
        user: validated 
      }),
      201
    );
  } catch (error) {
    return jsonResponse(
      { error: error.message },
      400
    );
  }
}
