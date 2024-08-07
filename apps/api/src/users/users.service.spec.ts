import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DeleteResult, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockUser } from '../../test/mocks/user.entity.mock';
import { mockUserDto } from '../../test/mocks/user.dto.mock';
import { of } from 'rxjs';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if found', (done) => {
      const username = 'testuser';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);

      service.findOne(username).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('should return null if user not found', (done) => {
      const username = 'testuser';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      service.findOne(username).subscribe({
        next: (user) => {
          expect(user).toBeNull();
          done();
        },
        error: (err) => done.fail(err),
      });
    });
  });

  describe('remove', () => {
    it('should call delete with the correct id', (done) => {
      const username = 'testuser';
      jest.spyOn(service, 'findOne').mockReturnValue(of(mockUser));
      const deleteSpy = jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({} as DeleteResult);

      service.remove(username).subscribe({
        next: () => {
          expect(deleteSpy).toHaveBeenCalledWith(mockUser.id);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('should do nothing if user is not found', (done) => {
      const username = 'testuser';
      jest.spyOn(service, 'findOne').mockReturnValue(of(null));
      const deleteSpy = jest.spyOn(repository, 'delete');

      service.remove(username).subscribe({
        next: () => {
          expect(deleteSpy).not.toHaveBeenCalled();
          done();
        },
        error: (err) => done.fail(err),
      });
    });
  });

  describe('save', () => {
    it('should save a user and return the saved entity', (done) => {
      jest.spyOn(repository, 'create').mockReturnValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser);
      service.save(mockUserDto).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          done();
        },
        error: (err) => done.fail(err),
      });
    });
  });
});
