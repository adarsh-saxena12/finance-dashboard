import { IsEnum } from 'class-validator';
import { Role } from '../../common/types';

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}