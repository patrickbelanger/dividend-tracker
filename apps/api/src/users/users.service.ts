import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { UserDto } from '../dtos/user.dto';
import { from, map, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findOne(username: string): Observable<User | null> {
    return from(this.usersRepository.findOneBy({ username }));
  }

  remove(username: string): Observable<void> {
    return this.findOne(username).pipe(
      switchMap((user) => {
        if (user) {
          return from(this.usersRepository.delete(user.id)).pipe(
            map(() => void 0),
          );
        }
        return of(void 0);
      }),
    );
  }

  save(userDto: UserDto): Observable<User> {
    const user = this.usersRepository.create(userDto);
    return from(this.usersRepository.save(user));
  }
}
