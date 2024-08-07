import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { catchError, from, map, Observable, switchMap, throwError } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  login(username: string, pass: string): Observable<any> {
    return from(this.usersService.findOne(username)).pipe(
      switchMap((existingUser) => {
        if (
          !existingUser ||
          (existingUser && !bcrypt.compareSync(pass, existingUser.password))
        ) {
          return throwError(() => new UnauthorizedException());
        }
        if (!existingUser.isActive) {
          return throwError(() => new UnauthorizedException('Inactive user'));
        }
        const payload = {
          id: existingUser.id,
          username: existingUser.username,
          isActive: existingUser.isActive,
        };

        return from(this.jwtService.signAsync(payload)).pipe(
          map((token) => ({
            access_token: token,
          })),
        );
      }),
    );
  }

  register(userDto: UserDto): Observable<any> {
    const { username, password } = userDto;
    return from(this.usersService.findOne(username)).pipe(
      switchMap((existingUser) => {
        if (existingUser) {
          return throwError(() => new ConflictException('User already exists'));
        }

        return from(bcrypt.hash(password, 10)).pipe(
          switchMap((hashedPassword) => {
            const newUser = {
              username,
              password: hashedPassword,
            };
            return from(this.usersService.save(newUser)).pipe(
              map((savedUser) => ({
                username: savedUser.username,
              })),
            );
          }),
          catchError((error) =>
            throwError(() => new InternalServerErrorException(error.message)),
          ),
        );
      }),
    );
  }
}
