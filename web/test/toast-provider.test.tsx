import "./setupAlias";
import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  createToastTimerRegistry,
  type ToastTimerRegistry,
} from "@/app/_components/ToastProvider";

test("an early toast is dismissed after five seconds even when later toasts appear", () => {
  mock.timers.enable({ apis: ["setTimeout"] });

  const removals: number[] = [];
  const registry: ToastTimerRegistry = createToastTimerRegistry((id) => {
    removals.push(id);
  });

  try {
    registry.sync([
      { id: 1, title: "Early toast" },
    ]);

    mock.timers.tick(3000);
    assert.deepEqual(removals, []);

    registry.sync([
      { id: 1, title: "Early toast" },
      { id: 2, title: "Later toast" },
    ]);

    mock.timers.tick(1999);
    assert.deepEqual(removals, []);

    mock.timers.tick(1);
    assert.deepEqual(removals, [1]);

    mock.timers.tick(5000);
    assert.deepEqual(removals, [1, 2]);
  } finally {
    registry.dispose();
    mock.timers.reset();
  }
});
