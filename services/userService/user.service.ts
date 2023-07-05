'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbUserMixin, encryptPassword, eventsUserMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import * as _ from 'lodash';
import {
	CreateUserParams,
	CreateUserParamsValidator,
	UserRole,
	MoleculerDBService,
	RestOptions,
	UserServiceOptions,
	UserServiceSettingsOptions,
	UserLoginParams,
	UpdateUserParams,
	UserLoginParamsValidator,
} from '../../types';
import bcrypt from 'bcryptjs';
import { IUser, UserEntity } from '../../entities';
import { CustomValidator } from '../../validators';
import { JsonConvert } from 'json2typescript';
import { checkFieldExist, convertObjectId } from '../../mixins/dbMixins/helpers.mixin';

@Service<UserServiceOptions>({
	name: 'admin.user',
	version: 1,
	mixins: [dbUserMixin, eventsUserMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/admin/user',
		fields: ['_id', 'email', 'fullname', 'roles', 'createdAt', 'updatedAt'],
	},
})
export default class UserService extends MoleculerDBService<UserServiceSettingsOptions, IUser> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/create:
	 *    post:
	 *      tags:
	 *      - "Admin User"
	 *      summary: create User
	 *      description: create User
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - password
	 *              - fullname
	 *              - role
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              password:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *              fullname:
	 *                type: string
	 *                default: fullname
	 *                description: fullname
	 *              role:
	 *                type: string
	 *                default: AGENT
	 *                description: role (ADMIN, AGENT)
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: create User
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false,
	})
	async create(ctx: Context<CreateUserParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CreateUserParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const findUser = await this.adapter.findOne({ email: entity.email });
			if (findUser) {
				return this.responseError('err_data_existed', 'Email Exist in system.');
			}

			const role: any = UserRole;
			if (role[entity.role] == undefined) {
				return this.responseError('err_not_found', 'Role not exist');
			}

			let entityUser: any = {
				email: entity.email,
				password: encryptPassword(entity.password),
				status: true,
				roles: [role[entity.role]],
				fullname: entity.fullname,
			};
			const parsedUserEntity = new JsonConvert()
				.deserializeObject(entityUser, UserEntity)
				.getMongoEntity();
			await this._create(ctx, parsedUserEntity);
			return this.responseSuccessMessage('Create user success');
		} catch (error) {
			this.logger.error('UserService - create', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/update:
	 *    post:
	 *      tags:
	 *      - "Admin User"
	 *      summary: update User
	 *      description: update User
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - userId
	 *              - email
	 *              - password
	 *              - fullname
	 *              - role
	 *            properties:
	 *              userId:
	 *                type: string
	 *                default: 63b4be1dfce7624bcb031a14
	 *                description: userId
	 *              email:
	 *                type: string
	 *                default: linhdev92@qa.team
	 *                description: email
	 *              password:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *              fullname:
	 *                type: string
	 *                default: fullname
	 *                description: fullname
	 *              role:
	 *                type: string
	 *                default: AGENT
	 *                description: role (ADMIN, AGENT)
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: create User
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false,
	})
	async update(ctx: Context<UpdateUserParams>) {
		try {
			const entity = ctx.params;
			if (!checkFieldExist(entity.userId)) {
				return this.responseError('err_not_found', 'User not exist');
			}

			const findUser = await this.adapter.findById(entity.userId)
			if (!findUser) {
				return this.responseError('err_not_found', 'User not exist');
			}

			let entityUser: any = {
				status: true,
			};
			if (checkFieldExist(entity.email)) {
				const findUser: IUser = await this.adapter.findOne({ email: entity.email });
				if (findUser && findUser.email !== entity.email) {
					return this.responseError('err_data_existed', 'Email Exist in system.');
				} else {
					entityUser.email = entity.email;
				}
			}
			if (checkFieldExist(entity.password)) {
				entityUser.password = encryptPassword(entity.password);
			}
			if (checkFieldExist(entity.fullname)) {
				entityUser.fullname = entity.fullname
			}
			if (checkFieldExist(entity.role)) {
				const role: any = UserRole;
				if (role[entity.role] == undefined) {
					return this.responseError('err_not_found', 'Role not exist');
				}
				entityUser.role = entity.role
			}
			await this.adapter.updateById(entity.userId, { $set: entityUser });
			return this.responseSuccessMessage('Update user success');
		} catch (error) {
			this.logger.error('UserService - Update', error);
			return this.responseUnkownError();
		}
	}

	@Post<RestOptions>('/create-tts-supper-admin', {
		name: 'create-tts-supper-admin',
		cache: false,
	})
	async createTtsSupperAdmin(ctx: Context<CreateUserParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CreateUserParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const findUser = await this.adapter.findOne({ email: entity.email });
			if (findUser) {
				return this.responseError('err_data_existed', 'Email Exist in system.');
			}

			const role: any = UserRole;
			if (role[entity.role] == undefined) {
				return this.responseError('err_not_found', 'Role not exist');
			}

			let entityUser: any = {
				email: entity.email,
				password: encryptPassword(entity.password),
				status: true,
				roles: [role[entity.role]],
				fullname: entity.fullname,
			};
			const parsedUserEntity = new JsonConvert()
				.deserializeObject(entityUser, UserEntity)
				.getMongoEntity();
			await this._create(ctx, parsedUserEntity);
			return this.responseSuccessMessage('Create user success');
		} catch (error) {
			this.logger.error('UserService - create', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/login:
	 *    post:
	 *      tags:
	 *      - "Admin User"
	 *      summary: login User
	 *      description: login User
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - password
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              password:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *      responses:
	 *        200:
	 *          description: login User
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/login', {
		name: 'login',
		cache: false,
	})
	async login(ctx: Context<UserLoginParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, UserLoginParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const findUser: any = await this.adapter.findOne({ email: entity.email });
			if (findUser) {
				if (findUser.status) {
					const valid = await bcrypt.compare(entity.password, findUser.password);
					if (valid) {
						const token = await ctx.call('v1.UserToken.create', {
							user_id: findUser._id,
						});
						if (token) {
							return this.responseSuccess({ message: 'Login success', token });
						} else {
							return this.responseUnkownError();
						}
					} else {
						return this.responseError('err_auth_fail', 'Email or password is wrong.');
					}
				} else {
					return this.responseError(
						'err_email_active_required',
						'Your account was locked.',
					);
				}
			} else {
				return this.responseError('err_not_found', 'Email or password wrong.');
			}
		} catch (error) {
			this.logger.error('UserService - login', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/logout:
	 *    get:
	 *      tags:
	 *      - "Admin User"
	 *      summary: logout user
	 *      description: logout user
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: logout success
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/logout', {
		name: 'logout',
		middleware: ['authAdmin'],
		cache: false,
	})
	async logout(ctx: Context<string, Record<string, any>>) {
		try {
			const token = ctx.meta.authorization;
			const user: any = await ctx.call('v1.admin.user.resolveToken', { token });
			if (user) {
				await ctx.call('v1.UserToken.delete', { user_id: user._id });
				this.broker.cacher?.clean('*.UserToken.resolveToken:' + token);
				this.broker.cacher?.clean('*.admin.user.resolveToken:' + token);
				return this.responseSuccess({ message: 'Logout success' });
			} else {
				return this.responseError('err_not_found', 'User not found');
			}
		} catch (error) {
			this.logger.error('UserService - logout:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/profile:
	 *    get:
	 *      tags:
	 *      - "Admin User"
	 *      summary: profile user
	 *      description: profile user
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: profile success
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/profile', {
		name: 'profile',
		middleware: ['authAdmin'],
		cache: false,
	})
	async profile(ctx: Context<string, Record<string, any>>) {
		try {
			const token = ctx.meta.authorization;
			const user: any = await ctx.call('v1.admin.user.resolveToken', { token });
			return user;
		} catch (error) {
			this.logger.error('UserService - logout:' + error);
			return this.responseUnkownError();
		}
	}
	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin User"
	 *      summary: delete user
	 *      description: delete user
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - userId
	 *            properties:
	 *              userId:
	 *                type: string
	 *                default: 63bd529d96526a001111ee7c
	 *                description: userId
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete success
	 *        403:
	 *          description: Server error
	 */
	@Delete<RestOptions>('/delete', {
		name: 'delete',
		middleware: ['authAdmin'],
		cache: false,
	})
	async delete(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			const user = await this.adapter.findById(params.userId)
			if (user) {
				const token = ctx.meta.authorization;
				const userCurrent: any = await ctx.call('v1.admin.user.resolveToken', { token });
				if (params.userId === userCurrent._id.toString()) {
					return this.responseError('err_not_found', 'Cant delete current user');
				} else {
					await this.adapter.removeById(params.userId)
					return this.responseSuccessMessage('Delete user success');
				}
			} else {
				return this.responseError('err_not_found', 'User not found');
			}
		} catch (error) {
			this.logger.error('UserService - logout:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/list:
	 *    get:
	 *      tags:
	 *      - "Admin User"
	 *      summary: list user
	 *      description: list user
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: page
	 *          description: page
	 *          in: query
	 *          required: true
	 *          type: number
	 *          example : 1
	 *          default : 1
	 *        - name: pageSize
	 *          description: pageSize
	 *          in: query
	 *          required: true
	 *          type: number
	 *          example : 10
	 *          default : 10
	 *        - name: email
	 *          description: email
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : linhdev92@gmail.com
	 *      responses:
	 *        200:
	 *          description: list success
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		middleware: ['authAdmin'],
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {
			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {};

			if (params.email != undefined) {
				query.email = params.email;
			}
			params.query = query;
			const data = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(data);
		} catch (error) {
			this.logger.error('UserService - logout:' + error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'resolveToken',
		cache: {
			keys: ['token'],
			ttl: 30 * 60, // 0,5 hour
		},
	})
	async resolveToken(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			const checkToken: any = await ctx.call('v1.UserToken.resolveToken', {
				token: params.token,
			});
			if (checkToken) {
				return this._get(ctx, { id: checkToken.user_id });
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error resolving token', e);
			return false;
		}
	}

	@Action({
		name: 'resolveTokenHeader',
		cache: false,
	})
	async resolveTokenHeader(ctx: Context<string, Record<string, any>>) {
		try {
			const token = ctx.meta.authorization;
			const checkToken: any = await ctx.call('v1.UserToken.resolveToken', { token });
			if (checkToken) {
				return this._get(ctx, { id: checkToken.user_id });
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error resolveTokenHeader', e);
			return false;
		}
	}

	@Action({
		name: 'findById',
		cache: {
			keys: ['user_id'],
			ttl: 60 * 60,
		},
	})
	async findById(ctx: Context) {
		try {
			const params: any = ctx.params;
			let user_id = convertObjectId(params.user_id.toString());
			const user: any = await this.adapter.findById(user_id);
			if (user) {
				return user;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('UserService - findById', e);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/user/detail:
	 *    get:
	 *      tags:
	 *      - "Admin User"
	 *      summary: detail User
	 *      description: detail User
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: userId
	 *          description: userId
	 *          in: query
	 *          required: true
	 *          type: string
	 *          example : 6333fc1b85e387279dad7f96
	 *          default : 6333fc1b85e387279dad7f96
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: detail user
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/detail', {
		name: 'detail',
		middleware: ['authAdmin'],
		cache: false,
	})
	async detail(ctx: Context) {
		try {
			let params: any = ctx.params;

			let user: any = await this.adapter.findById(params.userId);
			if (user == null) {
				return this.responseError('err_not_found', 'User not found.');
			}
			return this.responseSuccess(user);
		} catch (error) {
			this.logger.error('UserService - detail', error);
			return this.responseUnkownError();
		}
	}
}
