// Minimal in-memory publish/subscribe bus for domain events.
// Flow: handler -> command (validates and changes state) -> publish(event).
// The command only announces what happened and doesn't know who listens, so
// side effects (email, audit log, notifications) can be added with subscribe()
// without touching command code.
// No subscribers are registered yet; this is the extension point. For several
// backend instances or guaranteed delivery, replace it with a broker (e.g. Redis).


export type DomainEvent = {
  name: string;
  occurredAt: Date;
  payload: unknown;
};

type Handler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<string, Handler[]>();

export function subscribe(eventName: string, handler: Handler): void {
  const existing = handlers.get(eventName) ?? [];
  handlers.set(eventName, [...existing, handler]);
}

export async function publish(event: DomainEvent): Promise<void> {
  const listeners = handlers.get(event.name) ?? [];
  await Promise.all(listeners.map((handler) => handler(event)));
}
