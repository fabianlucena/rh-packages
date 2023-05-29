'use strict';

export class EventBus {
    handlers = {};

    $on(event, handler) {
        if (!this.handlers[event])
            this.handlers[event] = [];

        this.handlers[event].push(handler);
    }

    $off(event, handler) {
        if (this.handlers && this.handlers[event]) {
            for (let i = 0; i < this.handlers[event].length; i++) {
                const thisHandler = this.handlers[event];
                if (thisHandler === handler) {
                    this.handlers[event].splice(i, 1);
                    i--;
                }
            }
        }
    }

    $emit(event, ...params) {
        const handlers = this.handlers[event];
        if (!handlers)
            return;

        return handlers.map(handler => handler(...params));
    }
}

export const eventBus = new EventBus;