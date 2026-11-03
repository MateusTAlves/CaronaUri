type Handler = (payload?: any) => void;

const handlers: Record<string, Handler[]> = {};

export function on(event: string, fn: Handler) {
  handlers[event] = handlers[event] || [];
  handlers[event].push(fn);
  return () => {
    handlers[event] = handlers[event].filter((h) => h !== fn);
  };
}

export function emit(event: string, payload?: any) {
  (handlers[event] || []).slice().forEach((h) => h(payload));
}

export default { on, emit };
