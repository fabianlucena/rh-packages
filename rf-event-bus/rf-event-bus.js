export class EventBus {
  handlers = {};

  $on(event, handler) {
    const sanitizedEvent = event.toLowerCase();
    if (!this.handlers[sanitizedEvent]) {
      this.handlers[sanitizedEvent] = [];
    }

    this.handlers[sanitizedEvent].push(handler);
  }

  $off(event, handler) {
    const sanitizedEvent = event.toLowerCase();
    if (this.handlers && this.handlers[sanitizedEvent]) {
      for (let i = 0; i < this.handlers[sanitizedEvent].length; i++) {
        const thisHandler = this.handlers[sanitizedEvent];
        if (thisHandler === handler) {
          this.handlers[sanitizedEvent].splice(i, 1);
          i--;
        }
      }
    }
  }

  async $emit(event, ...params) {
    const sanitizedEvent = event.toLowerCase();
    const handlers = this.handlers[sanitizedEvent];
    if (!handlers) {
      return [];
    }

    const result = [];
    for (const handler of handlers) {
      const thisResult = await handler(...params);
      if (thisResult !== undefined) {
        result.push(thisResult);
      }
    }

    return result;
  }
}

export const eventBus = new EventBus;