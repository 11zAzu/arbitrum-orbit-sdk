import { Address, Chain, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from './abi';

const cache: Record<string, Address> = {};
export async function getRollupAddress<TChain extends Chain | undefined>(
  publicClient: PublicClient<Transport, TChain>,
  params: { sequencerInbox: Address } | { rollupAdminLogic: Address },
): Promise<Address> {
  // rollupAdminLogic was passed as an override, return directly
  if ('rollupAdminLogic' in params) {
    return params.rollupAdminLogic;
  }

  const addressFromCache = cache[`${publicClient.chain?.id}_${params.sequencerInbox}`];
  if (addressFromCache) {
    return addressFromCache;
  }

  // Otherwise, fetch the rollup address from sequencerInbox contract
  const rollupAddress = await publicClient.readContract({
    functionName: 'rollup',
    address: params.sequencerInbox,
    abi: sequencerInboxABI,
  });
  cache[`${publicClient.chain?.id}_${params.sequencerInbox}`] = rollupAddress;
  return rollupAddress;
}