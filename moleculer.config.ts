'use strict';
import { inspect } from 'util';
import { BrokerOptions, Errors, MetricRegistry } from 'moleculer';
import 'reflect-metadata';
import ServiceCheckAuth = require('./middlewares/ServiceCheckAuth');
import ServiceCheckAuthAdmin = require('./middlewares/ServiceCheckAuthAdmin');
import ServiceCheckCaptcha = require('./middlewares/ServiceCheckCaptcha');
import { Config } from './common';
import MoleculerRetryableError = Errors.MoleculerRetryableError;


const brokerConfig: BrokerOptions = {
	namespace: Config.NAMESPACE,
	nodeID: Config.NODEID,
	metadata: {},
	logger: {
		type: Config.LOGGERTYPE,
		options: {
			colors: JSON.parse(Config.LOGGERCOLORS) || true,
			moduleColors: JSON.parse(Config.LOGGERMODULECOLORS) || false,
			formatter: Config.LOGGERFORMATTER || 'full',
			objectPrinter: (o: never) => inspect(o, { depth: 4, colors: true, breakLength: 100 }),
			autoPadding: JSON.parse(Config.LOGGERAUTOPADDING) || false,
		},
	},
	logLevel: Config.LOGLEVEL,
	transporter: Config.TRANSPORTER || undefined,
	cacher: {
		type: "Redis",
		options: {
			prefix: Config.REDIS_INFO.prefix,
			ttl: 60,
			monitor: false,
			redis: {
				host: Config.REDIS_INFO.host,
				port: Config.REDIS_INFO.port,
				password: Config.REDIS_INFO.password,
				username: Config.REDIS_INFO.username,
				db: Config.REDIS_INFO.db,
				tls: Config.REDIS_INFO.tls
			}
		}
	},
	serializer: Config.SERIALIZER,
	requestTimeout: Config.REQUEST_TIMEOUT,
	retryPolicy: {
		enabled: Config.RETRYPOLICY,
		retries: Config.RETRIES,
		delay: Config.RETRYDELAY,
		maxDelay: Config.RETRYMAXDELAY,
		factor: Config.RETRYFACTOR,
		check: (err: Error): boolean =>
			err && err instanceof MoleculerRetryableError && !!err.retryable,
	},
	maxCallLevel: Config.MAXCALLLEVEL,
	heartbeatInterval: Config.HEARTBEATINTERVAL,
	heartbeatTimeout: Config.HEARTBEATTIMEOUT,
	contextParamsCloning: JSON.parse(Config.CTXPARAMSCLONING) || false,
	tracking: {
		enabled: JSON.parse(Config.TRACKING_ENABLED) || false,
		shutdownTimeout: Config.TRACKINGSHUTDOWNTIME,
	},
	disableBalancer: JSON.parse(Config.BALANCER_ENABLED) || false,
	registry: {
		strategy: Config.STRATEGY || 'RoundRobin',
		preferLocal: JSON.parse(Config.PREFERLOCAL) || true,
	},
	circuitBreaker: {
		enabled: JSON.parse(Config.BREAKER_ENABLED) || false,
		threshold: Config.BREAKERTHRESHOLD || 0.5,
		minRequestCount: Config.BREAKERMINREQCOUNT || 20,
		windowTime: Config.WINDOWTIME || 60,
		halfOpenTime: Config.HALFOPENTIME || 10 * 1000,
		check: (err: Error): boolean =>
			err && err instanceof MoleculerRetryableError && err.code >= 500,
	},
	bulkhead: {
		enabled: JSON.parse(Config.BULKHEAD_ENABLED) || false,
		concurrency: Config.CONCURRENCY || 10,
		maxQueueSize: Config.MAXQUEUESIZE || 100,
	},
	validator: false,
	metrics: {
		enabled: Config.METRICS_ENABLED,
		reporter: {
			type: Config.METRICS_TYPE,
			options: {
				port: Config.METRICS_PORT || 3030,
				path: Config.METRICS_PATH || '/metrics',
				defaultLabels: (registry: MetricRegistry) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
			},
		},
	},
	tracing: {
		enabled: Config.TRACING_ENABLED,
		exporter: {
			type: Config.TRACING_TYPE,
			options: {
				logger: null,
				colors: JSON.parse(Config.TRACING_COLORS) || true,
				width: Config.TRACING_WIDTH || 100,
				gaugeWidth: Config.TRACING_GUAGEWIDTH || 40,
			},
		},
	},
	middlewares: [ServiceCheckAuth, ServiceCheckAuthAdmin, ServiceCheckCaptcha]
};

export = brokerConfig;
