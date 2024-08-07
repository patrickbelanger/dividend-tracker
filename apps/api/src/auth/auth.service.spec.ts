import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { mockUser } from '../../test/mocks/user.entity.mock';
import { of } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { mockUserDto } from '../../test/mocks/user.dto.mock';

const mockJwtToken = 'mockJwtToken';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should return a JWT token if login is successful', (done) => {
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(mockUser));
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockJwtToken);

      service.login(mockUser.username, 'password').subscribe({
        next: (result) => {
          expect(result).toEqual({ access_token: mockJwtToken });
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('should throw UnauthorizedException if user not found', (done) => {
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(null));

      service.login(mockUser.username, 'password').subscribe({
        next: () => done.fail('Expected an error, but got a result'),
        error: (err) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          done();
        },
      });
    });

    it('should throw UnauthorizedException if password is incorrect', (done) => {
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(mockUser));
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      service.login(mockUser.username, 'wrongpassword').subscribe({
        next: () => done.fail('Expected an error, but got a result'),
        error: (err) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          done();
        },
      });
    });

    it('should throw UnauthorizedException if user is inactive', (done) => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(inactiveUser));
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      service.login(mockUser.username, 'password').subscribe({
        next: () => done.fail('Expected an error, but got a result'),
        error: (err) => {
          expect(err).toBeInstanceOf(UnauthorizedException);
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('should register a new user and return the username', (done) => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(null));
      jest.spyOn(usersService, 'save').mockReturnValue(of(mockUser));

      service.register(mockUserDto).subscribe({
        next: (result) => {
          expect(result).toEqual({ username: mockUser.username });
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('should throw ConflictException if user already exists', (done) => {
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(mockUser));

      service.register(mockUserDto).subscribe({
        next: () => done.fail('Expected an error, but got a result'),
        error: (err) => {
          expect(err).toBeInstanceOf(ConflictException);
          done();
        },
      });
    });

    it('should throw InternalServerErrorException if bcrypt fails', (done) => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));
      jest.spyOn(usersService, 'findOne').mockReturnValue(of(null));

      service.register(mockUserDto).subscribe({
        next: () => done.fail('Expected an error, but got a result'),
        error: (err) => {
          expect(err).toBeInstanceOf(InternalServerErrorException);
          done();
        },
      });
    });
  });
});
