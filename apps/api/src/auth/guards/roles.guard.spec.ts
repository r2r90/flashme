import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

const createMockContext = (userRole?: string) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () =>
        userRole
          ? {
              user: {
                id: 'user-id',
                email: 'test@test.com',
                role: userRole,
                tenantId: 'tenant-id',
              },
            }
          : {},
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    mockReflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext(Role.CLIENT);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when roles array is empty', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext(Role.CLIENT);
    expect(guard.canActivate(context)).toBe(true);
  });

  it.each([[Role.ARTIST], [Role.OWNER]])(
    'should allow %s to access ARTIST/OWNER route',
    (role) => {
      mockReflector.getAllAndOverride.mockReturnValue([
        Role.ARTIST,
        Role.OWNER,
      ]);
      const context = createMockContext(role);
      expect(guard.canActivate(context)).toBe(true);
    },
  );

  it('should deny CLIENT access to ARTIST route', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ARTIST, Role.OWNER]);
    const context = createMockContext(Role.CLIENT);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow CLIENT to access CLIENT route', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.CLIENT]);
    const context = createMockContext(Role.CLIENT);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.CLIENT]);
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should call reflector with correct arguments', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.CLIENT]);
    const context = createMockContext(Role.CLIENT);
    guard.canActivate(context);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
      expect.anything(),
      [context.getHandler(), context.getClass()],
    );
  });
});
