import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { mockUserDto } from '../../test/mocks/user.dto.mock';

const mockLoginResponse = { access_token: 'mockJwtToken' };

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token if login is successful', async () => {
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      const result = await firstValueFrom(
        authController.login({ username: 'testuser', password: 'password' }),
      );
      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password');
    });

    it('should handle UnauthorizedException', async () => {
      jest
        .spyOn(authService, 'login')
        .mockReturnValue(throwError(() => new UnauthorizedException()));

      try {
        await firstValueFrom(
          authController.login({
            username: 'testuser',
            password: 'wrongpassword',
          }),
        );
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  describe('register', () => {
    it('should return the username if registration is successful', async () => {
      jest
        .spyOn(authService, 'register')
        .mockReturnValue(of({ username: 'testuser' }));

      const result = await firstValueFrom(authController.register(mockUserDto));
      expect(result).toEqual({ username: 'testuser' });
      expect(authService.register).toHaveBeenCalledWith(mockUserDto);
    });

    it('should handle ConflictException', async () => {
      jest
        .spyOn(authService, 'register')
        .mockReturnValue(
          throwError(() => new ConflictException('User already exists')),
        );

      try {
        await firstValueFrom(authController.register(mockUserDto));
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictException);
      }
    });

    it('should handle InternalServerErrorException', async () => {
      jest
        .spyOn(authService, 'register')
        .mockReturnValue(
          throwError(() => new InternalServerErrorException('Server error')),
        );

      try {
        await firstValueFrom(authController.register(mockUserDto));
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });
});
