export class EventBus {
    handlers = {};

    $on(event, handler) {
        const sanitEvent = event.toLowerCase();
        if (!this.handlers[sanitEvent]) {
            this.handlers[sanitEvent] = [];
        }

        this.handlers[sanitEvent].push(handler);
    }

    $off(event, handler) {
        const sanitEvent = event.toLowerCase();
        if (this.handlers && this.handlers[sanitEvent]) {
            for (let i = 0; i < this.handlers[sanitEvent].length; i++) {
                const thisHandler = this.handlers[sanitEvent];
                if (thisHandler === handler) {
                    this.handlers[sanitEvent].splice(i, 1);
                    i--;
                }
            }
        }
    }

    async $emit(event, ...params) {
        const sanitEvent = event.toLowerCase();
        const handlers = this.handlers[sanitEvent];
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