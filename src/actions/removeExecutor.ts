import {
  Address,
  Chain,
  PrepareTransactionRequestParameters,
  PrepareTransactionRequestReturnType,
  PublicClient,
  Transport,
  encodeFunctionData,
} from 'viem';
import { upgradeExecutor } from '../contracts';
import { ActionParameters, WithAccount } from '../types/Actions';
import { Prettify } from '../types/utils';
import { UPGRADE_EXECUTOR_ROLE_EXECUTOR } from '../upgradeExecutorEncodeFunctionData';

export type RemoveExecutorParameters<Curried extends boolean = false> = Prettify<
  WithAccount<
    ActionParameters<
      {
        address: Address;
      },
      'upgradeExecutor',
      Curried
    >
  >
>;

export type RemoveExecutorReturnType = PrepareTransactionRequestReturnType;

function upgradeExecutorFunctionData({ address }: RemoveExecutorParameters) {
  return encodeFunctionData({
    abi: upgradeExecutor.abi,
    functionName: 'revokeRole',
    args: [UPGRADE_EXECUTOR_ROLE_EXECUTOR, address],
  });
}

export async function removeExecutor<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  args: RemoveExecutorParameters,
): Promise<RemoveExecutorReturnType> {
  const data = upgradeExecutorFunctionData(args);

  return client.prepareTransactionRequest({
    to: args.upgradeExecutor,
    value: BigInt(0),
    chain: client.chain,
    data,
    account: args.account,
  } satisfies PrepareTransactionRequestParameters);
}
