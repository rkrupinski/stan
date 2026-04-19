/**
 * @jest-environment jsdom
 */
import { defineComponent, h, nextTick, type PropType } from 'vue';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';

import { selector, selectorFamily } from './selector';
import { DEFAULT_STORE, makeStore, type Store } from './store';
import { atom } from './atom';
import {
  useStan,
  useStanValue,
  useStanValueAsync,
  useStanRefresh,
  useStanReset,
  useStanCallback,
  StanProvider,
  provideStan,
  type AsyncValue,
} from './vue';

enableAutoUnmount(afterEach);

const render = <T>(setup: () => Record<string, unknown>, store?: Store) => {
  const Probe = defineComponent({
    name: 'TestProbe',
    setup,
    render: () => null,
  });

  const Root = defineComponent({
    render() {
      return h(StanProvider, { store }, { default: () => h(Probe) });
    },
  });

  const wrapper = mount(Root);
  const vm = wrapper.findComponent(Probe).vm as unknown as T;

  return { wrapper, vm };
};

describe('useStan', () => {
  it('should initialize with the current state value', () => {
    const testAtom = atom(42);

    const { vm } = render<{ state: number }>(() => ({
      state: useStan(testAtom),
    }));

    expect(vm.state).toBe(42);
  });

  it('should write through to the store when value is set', async () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { vm } = render<{ state: number }>(
      () => ({ state: useStan(testAtom) }),
      store,
    );

    vm.state = 43;
    await nextTick();

    expect(testAtom(store).get()).toBe(43);
  });

  it('should propagate changes when state is updated externally', async () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { vm } = render<{ state: number }>(
      () => ({ state: useStan(testAtom) }),
      store,
    );

    testAtom(store).set(43);
    await nextTick();

    expect(vm.state).toBe(43);
  });
});

describe('useStanValue', () => {
  it('should initialize with the current selector value', () => {
    const testSelector = selector(() => 42);

    const { vm } = render<{ value: number }>(() => ({
      value: useStanValue(testSelector),
    }));

    expect(vm.value).toBe(42);
  });

  it('should initialize with the current async selector value', async () => {
    const testSelector = selector(() => Promise.resolve(42));

    const { vm } = render<{ value: Promise<number> }>(() => ({
      value: useStanValue(testSelector),
    }));

    await expect(vm.value).resolves.toBe(42);
  });

  it('should propagate changes', async () => {
    const testAtom = atom(42);
    const testSelector = selector(({ get }) => get(testAtom) + 1);
    const store = makeStore();

    const { vm } = render<{ value: number }>(
      () => ({ value: useStanValue(testSelector) }),
      store,
    );

    testAtom(store).set(43);
    await nextTick();

    expect(vm.value).toBe(44);
  });

  it('should unsubscribe on unmount', () => {
    const testSelector = selector(() => 42);
    const mockUnsubscribe = jest.fn();
    const store = makeStore();

    jest
      .spyOn(testSelector(store), 'subscribe')
      .mockReturnValueOnce(mockUnsubscribe);

    const { wrapper } = render(
      () => ({ value: useStanValue(testSelector) }),
      store,
    );

    wrapper.unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should handle LRU cache eviction during simultaneous hook mounting', async () => {
    const evalCount = jest.fn();
    const CACHE_SIZE = 2;
    const ITEM_COUNT = 3;

    const testFamily = selectorFamily(
      (id: number) => () => {
        evalCount(id);
        return id;
      },
      {
        cachePolicy: { type: 'lru', maxSize: CACHE_SIZE },
      },
    );

    const store = makeStore();

    const Child = defineComponent({
      props: { id: { type: Number, required: true } },
      setup(props) {
        useStanValue(testFamily(props.id));
        return () => null;
      },
    });

    const App = defineComponent({
      render() {
        return h(
          StanProvider,
          { store },
          {
            default: () =>
              Array.from({ length: ITEM_COUNT }, (_, i) => h(Child, { id: i })),
          },
        );
      },
    });

    mount(App);

    await flushPromises();

    expect(evalCount).toHaveBeenCalledTimes(ITEM_COUNT);
  });
});

describe('useStanValueAsync', () => {
  it('should handle success', async () => {
    const testSelector = selector(() => Promise.resolve(42));

    const { vm } = render<{ async: AsyncValue<number> }>(() => ({
      async: useStanValueAsync(testSelector),
    }));

    expect(vm.async).toEqual({ type: 'loading' });

    await flushPromises();

    expect(vm.async).toEqual({ type: 'ready', value: 42 });
  });

  it('should handle errors', async () => {
    const error = new Error('Nope');
    const testSelector = selector(() => Promise.reject(error));

    const { vm } = render<{ async: AsyncValue<number> }>(() => ({
      async: useStanValueAsync(testSelector),
    }));

    expect(vm.async).toEqual({ type: 'loading' });

    await flushPromises();

    expect(vm.async).toEqual({ type: 'error', reason: error });
  });

  it('should handle changes in dependencies', async () => {
    const dep = atom(42);
    const testSelector = selector(({ get }) => Promise.resolve(get(dep)));
    const store = makeStore();

    const { vm } = render<{ async: AsyncValue<number> }>(
      () => ({ async: useStanValueAsync(testSelector) }),
      store,
    );

    expect(vm.async).toEqual({ type: 'loading' });

    await flushPromises();

    expect(vm.async).toEqual({ type: 'ready', value: 42 });

    dep(store).set(43);

    expect(vm.async).toEqual({ type: 'loading' });

    await flushPromises();

    expect(vm.async).toEqual({ type: 'ready', value: 43 });
  });

  it('should unsubscribe on unmount', async () => {
    const testSelector = selector(() => Promise.resolve(42));
    const mockUnsubscribe = jest.fn();
    const store = makeStore();

    jest
      .spyOn(testSelector(store), 'subscribe')
      .mockReturnValueOnce(mockUnsubscribe);

    const { wrapper } = render(
      () => ({ value: useStanValue(testSelector) }),
      store,
    );

    wrapper.unmount();

    await flushPromises();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useStanRefresh', () => {
  it('should return a function that refreshes the state', () => {
    const mockSelectorFn = jest
      .fn()
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43)
      .mockReturnValueOnce(44);

    const testSelector = selector(mockSelectorFn);
    const store = makeStore();

    // Prime the cache: first get evaluates, second is served from cache.
    testSelector(store).get();
    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    testSelector(store).get();
    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    const { vm } = render<{ refresh: () => void }>(
      () => ({ refresh: useStanRefresh(testSelector) }),
      store,
    );

    // Unmounted selector: refresh invalidates lazily, no immediate re-eval.
    vm.refresh();
    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    // Next get picks up the invalidation and re-evaluates.
    expect(testSelector(store).get()).toBe(43);
    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    // Mount the selector.
    testSelector(store).subscribe(jest.fn());

    // Mounted selector: refresh re-evaluates eagerly.
    vm.refresh();
    expect(mockSelectorFn).toHaveBeenCalledTimes(3);
    expect(testSelector(store).get()).toBe(44);
  });
});

describe('useStanReset', () => {
  it('should return a function that resets the state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).get();

    const { vm } = render<{ reset: () => void }>(
      () => ({ reset: useStanReset(testAtom) }),
      store,
    );

    testAtom(store).set(43);

    vm.reset();

    expect(testAtom(store).get()).toBe(42);
  });
});

describe('useStanCallback', () => {
  it('should allow setting writable state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { vm } = render<{ cb: (val: number) => void }>(
      () => ({
        cb: useStanCallback(
          ({ set }) =>
            (val: number) =>
              set(testAtom, val),
        ),
      }),
      store,
    );

    vm.cb(43);

    expect(testAtom(store).get()).toBe(43);
  });

  it('should allow resetting writable state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).set(43);

    const { vm } = render<{ cb: () => void }>(
      () => ({
        cb: useStanCallback(
          ({ reset }) =>
            () =>
              reset(testAtom),
        ),
      }),
      store,
    );

    vm.cb();

    expect(testAtom(store).get()).toBe(42);
  });

  it('should allow refreshing readonly state', () => {
    const mockFn = jest.fn().mockReturnValue(42);
    const testSelector = selector(mockFn);
    const store = makeStore();

    testSelector(store).get();
    testSelector(store).subscribe(() => {});
    expect(mockFn).toHaveBeenCalledTimes(1);

    const { vm } = render<{ cb: () => void }>(
      () => ({
        cb: useStanCallback(
          ({ refresh }) =>
            () =>
              refresh(testSelector),
        ),
      }),
      store,
    );

    vm.cb();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should allow getting atom value', () => {
    const testAtom = atom(42);
    const store = makeStore();

    let capturedValue;
    const { vm } = render<{ cb: () => void }>(
      () => ({
        cb: useStanCallback(({ get }) => () => {
          capturedValue = get(testAtom);
        }),
      }),
      store,
    );

    vm.cb();

    expect(capturedValue).toBe(42);
  });

  it('should allow getting synchronous selector value', () => {
    const testAtom = atom(42);
    const testSelector = selector(({ get }) => get(testAtom) * 2);
    const store = makeStore();

    let capturedValue;
    const { vm } = render<{ cb: () => void }>(
      () => ({
        cb: useStanCallback(({ get }) => () => {
          capturedValue = get(testSelector);
        }),
      }),
      store,
    );

    vm.cb();

    expect(capturedValue).toBe(84);
  });

  it('should allow getting resolved asynchronous selector value', async () => {
    const testSelector = selector(() => Promise.resolve(42));
    const store = makeStore();

    let capturedValue;
    const { vm } = render<{ cb: () => Promise<void> }>(
      () => ({
        cb: useStanCallback(({ get }) => async () => {
          capturedValue = await get(testSelector);
        }),
      }),
      store,
    );

    await vm.cb();

    expect(capturedValue).toBe(42);
  });

  it('should allow handling rejected asynchronous selector value', async () => {
    const error = new Error('Nope');
    const testSelector = selector(() => Promise.reject(error));
    const store = makeStore();

    let capturedError;
    const { vm } = render<{ cb: () => Promise<void> }>(
      () => ({
        cb: useStanCallback(({ get }) => async () => {
          try {
            await get(testSelector);
          } catch (e) {
            capturedError = e;
          }
        }),
      }),
      store,
    );

    await vm.cb();

    expect(capturedError).toBe(error);
  });
});

describe('provideStan', () => {
  it('should provide a store to descendants', () => {
    const testAtom = atom(42);
    const store = makeStore();
    testAtom(store).set(99);

    const Probe = defineComponent({
      setup: () => ({ state: useStan(testAtom) }),
      render: () => null,
    });

    const Root = defineComponent({
      setup(_, { slots }) {
        provideStan(store);
        return () => slots.default?.();
      },
    });

    const wrapper = mount(Root, { slots: { default: () => h(Probe) } });
    const vm = wrapper.findComponent(Probe).vm as unknown as { state: number };

    expect(vm.state).toBe(99);
  });

  it('should create a fresh store when called without arguments', () => {
    const testAtom = atom(42);
    testAtom(DEFAULT_STORE).set(99);

    const Probe = defineComponent({
      setup: () => ({ state: useStan(testAtom) }),
      render: () => null,
    });

    const Root = defineComponent({
      setup(_, { slots }) {
        provideStan();
        return () => slots.default?.();
      },
    });

    const wrapper = mount(Root, { slots: { default: () => h(Probe) } });
    const vm = wrapper.findComponent(Probe).vm as unknown as { state: number };

    expect(vm.state).toBe(42);
  });
});

describe('StanProvider', () => {
  it('should create a fresh store when no store prop is passed', () => {
    const testAtom = atom(42);

    testAtom(DEFAULT_STORE).set(99);

    const { vm } = render<{ state: number }>(() => ({
      state: useStan(testAtom),
    }));

    expect(vm.state).toBe(42);
  });

  it('should use DEFAULT_STORE in provider-less mode', () => {
    const testAtom = atom(0);

    testAtom(DEFAULT_STORE).set(99);

    const Probe = defineComponent({
      name: 'TestProbe',
      setup() {
        return { state: useStan(testAtom) };
      },
      render: () => null,
    });

    const wrapper = mount(Probe);
    const vm = wrapper.vm as unknown as { state: number };

    expect(vm.state).toBe(99);
  });

  it('should use the provided store', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).set(100);

    const { vm } = render<{ state: number }>(
      () => ({ state: useStan(testAtom) }),
      store,
    );

    expect(vm.state).toBe(100);
  });

  it('should allow useStanCallback to pick up a new store after re-mount', async () => {
    const testAtom = atom(0);
    const storeA = makeStore();
    const storeB = makeStore();

    testAtom(storeA).set(10);
    testAtom(storeB).set(20);

    let capturedValue: number | undefined;

    const Probe = defineComponent({
      name: 'TestProbe',
      setup() {
        const getValue = useStanCallback(({ get }) => () => {
          capturedValue = get(testAtom);
        });
        return { getValue };
      },
      render: () => null,
    });

    const App = defineComponent({
      props: {
        store: { type: Object as PropType<Store>, required: true },
      },
      setup(props, { slots }) {
        return () =>
          h(
            StanProvider,
            { store: props.store },
            { default: () => slots.default?.() },
          );
      },
    });

    const wrapper = mount(App, {
      props: { store: storeA },
      slots: { default: () => h(Probe) },
    });

    const probeA = wrapper.findComponent(Probe).vm as unknown as {
      getValue: () => void;
    };
    probeA.getValue();
    expect(capturedValue).toBe(10);

    await wrapper.setProps({ store: storeB });

    // Probe survives the prop change but useStanCallback reads store.value at invocation time
    const probeB = wrapper.findComponent(Probe).vm as unknown as {
      getValue: () => void;
    };
    probeB.getValue();
    expect(capturedValue).toBe(20);
  });
});
