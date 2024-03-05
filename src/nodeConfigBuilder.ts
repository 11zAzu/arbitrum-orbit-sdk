import { NodeConfig, NodeConfigOption } from './types/NodeConfig.generated';
import { CoreContracts } from './types/CoreContracts';
import { parentChainIsArbitrum, stringifyJson } from './nodeConfigBuilderUtils';
import { nodeConfigBuilderDefaults } from './nodeConfigBuilderDefaults';
import { ParentChainId } from './types/ParentChain';
import { ChainConfig } from './types/ChainConfig';
import {
  NodeConfigChainInfoJson,
  NodeConfigDataAvailabilityRpcAggregatorBackendsJson,
} from './types/NodeConfig';

export type NodeConfigOptionKey = NodeConfigOption['key'];

export type NodeConfigOptionGetType<TKey extends NodeConfigOptionKey> = Extract<
  NodeConfigOption,
  { key: TKey }
>['type'];

export type NodeConfigBuilderEnableBatchPosterParams = {
  privateKey: string;
};

export type NodeConfigBuilderEnableStakerParams = {
  privateKey: string;
};

export class NodeConfigBuilder {
  private nodeConfig: NodeConfig;
  private isInitialized: boolean;

  constructor(initialNodeConfig?: NodeConfig) {
    this.nodeConfig = initialNodeConfig ?? {};
    this.isInitialized = false;
  }

  private prepareChainInfoJson(params: InitializeThings): NodeConfigChainInfoJson {
    return [
      {
        'chain-id': params.chain.id,
        'chain-name': params.chain.name,
        'chain-config': params.chain.config,
        'parent-chain-id': params.parentChain.id,
        'parent-chain-is-arbitrum': parentChainIsArbitrum(params.parentChain.id),
        'rollup': {
          'bridge': params.parentChain.coreContracts.bridge,
          'inbox': params.parentChain.coreContracts.inbox,
          'sequencer-inbox': params.parentChain.coreContracts.sequencerInbox,
          'rollup': params.parentChain.coreContracts.rollup,
          'validator-utils': params.parentChain.coreContracts.validatorUtils,
          'validator-wallet-creator': params.parentChain.coreContracts.validatorWalletCreator,
          'deployed-at': params.parentChain.coreContracts.deployedAtBlockNumber,
        },
      },
    ];
  }

  public initialize(params: InitializeThings): NodeConfigBuilder {
    const chainInfoJson = stringifyJson<NodeConfigChainInfoJson>(this.prepareChainInfoJson(params));

    this.set('chain.name', params.chain.name);
    this.set('chain.info-json', chainInfoJson);

    this.set('parent-chain.id', params.parentChain.id);
    this.set('parent-chain.connection.url', params.parentChain.rpcUrl);

    this.isInitialized = true;

    return this;
  }

  public enableSequencer(): NodeConfigBuilder {
    this.set('node.sequencer', true);

    this.set('node.delayed-sequencer.enable', true);
    this.set('node.delayed-sequencer.use-merge-finality', false);
    this.set('node.delayed-sequencer.finalize-distance', 1);

    this.set('node.dangerous.no-sequencer-coordinator', true);

    this.set('execution.forwarding-target', '');

    this.set('execution.sequencer.enable', true);
    this.set('execution.sequencer.max-tx-data-size', 85_000);
    this.set('execution.sequencer.max-block-speed', '250ms');

    this.set('execution.caching.archive', true);

    return this;
  }

  public enableBatchPoster(params: NodeConfigBuilderEnableBatchPosterParams): NodeConfigBuilder {
    this.set('node.batch-poster.enable', true);
    this.set('node.batch-poster.max-size', 90_000);
    this.set('node.batch-poster.parent-chain-wallet.private-key', params.privateKey);

    return this;
  }

  public enableStaker(params: NodeConfigBuilderEnableStakerParams): NodeConfigBuilder {
    this.set('node.staker.enable', true);
    this.set('node.staker.strategy', 'MakeNodes');
    this.set('node.staker.parent-chain-wallet.private-key', params.privateKey);

    return this;
  }

  public enableDataAvailabilityService(): NodeConfigBuilder {
    const backendsJson = stringifyJson<NodeConfigDataAvailabilityRpcAggregatorBackendsJson>([
      {
        url: 'http://localhost:9876',
        pubkey:
          'YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
        signermask: 1,
      },
    ]);

    this.set('node.data-availability.enable', true);

    this.set('node.data-availability.rest-aggregator.enable', true);
    this.set('node.data-availability.rest-aggregator.urls', ['http://localhost:9877']);

    this.set('node.data-availability.rpc-aggregator.enable', true);
    this.set('node.data-availability.rpc-aggregator.assumed-honest', 1);
    this.set('node.data-availability.rpc-aggregator.backends', backendsJson);

    return this;
  }

  set<TKey extends NodeConfigOptionKey>(
    key: TKey,
    value: NodeConfigOptionGetType<TKey>,
  ): NodeConfigBuilder {
    // if (!this.isInitialized) {
    //   throw new Error(`You must first call ".initialize()" on the builder`);
    // }

    const keys = key.split('.');
    let currentObject = this.nodeConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      // @ts-ignore
      if (!currentObject[currentKey]) {
        // @ts-ignore
        currentObject[currentKey] = {};
      }
      // @ts-ignore
      currentObject = currentObject[currentKey];
    }

    const finalKey = keys[keys.length - 1];
    // @ts-ignore
    currentObject[finalKey] = value;

    return this;
  }

  build(): NodeConfig {
    return this.nodeConfig;
  }
}

type NodeConfigCoreContracts = Pick<
  CoreContracts,
  | 'bridge'
  | 'inbox'
  | 'sequencerInbox'
  | 'rollup'
  | 'validatorUtils'
  | 'validatorWalletCreator'
  | 'deployedAtBlockNumber'
>;

export type InitializeThings = {
  chain: {
    id: number;
    name: string;
    config: ChainConfig;
  };
  parentChain: {
    id: ParentChainId;
    rpcUrl: string;
    coreContracts: NodeConfigCoreContracts;
  };
};

export type CreateNodeConfigBuilderParams = {
  withDefaults?: boolean;
};

export function createNodeConfigBuilder(params?: CreateNodeConfigBuilderParams): NodeConfigBuilder {
  const withDefaults = params?.withDefaults ?? true;

  if (!withDefaults) {
    return new NodeConfigBuilder();
  }

  return new NodeConfigBuilder(nodeConfigBuilderDefaults);
}
