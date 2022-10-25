import type { BaseProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { get, writable } from 'svelte/store';

interface ResolvedRecord {
  name?: string;
  avatarUrl?: string;
}

type State = {
  [address: string]: ResolvedRecord;
};

export default (() => {
  const state = writable<State>({});
  let provider = ethers.getDefaultProvider();

  /**
   * Connect the store to a provider, which is needed in order to resolve ENS
   * records.
   * @param toProvider The provider to connect to.
   */
  function connect(toProvider: BaseProvider) {
    provider = toProvider;
  }

  /**
   * Perform an ENS lookup for the provided address, and append the result to the
   * store state. Looks up ENS name & avatar URL.
   * @param address The address to attempt resolving.
   */
  async function lookup(address: string): Promise<void> {
    const saved = get(state)[address];
    if (saved) return;

    // Initially write an empty object to prevent multiple in-flight requests
    // for the same name
    state.update((s) => ({ ...s, [address]: {} }));

    const lookups = [provider?.lookupAddress(address), provider?.getAvatar(address)];

    const [name, avatarUrl] = await Promise.all(lookups);

    if (name || avatarUrl) {
      const resolvedRecord = {
        name: name ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      };

      state.update((s) => ({
        ...s,
        [address]: resolvedRecord,
      }));
    }
  }

  function clear() {
    state.set({});
  }

  return {
    subscribe: state.subscribe,
    connect,
    lookup,
    clear,
  };
})();