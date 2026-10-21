import { test } from "node:test";
import assert from "node:assert/strict";
import type { Task } from "../../apis/todo.ts";
import { agenda, countTasks, dueState, NO_FILTERS, selectTasks, tagCounts } from "./views.ts";

const TODAY = "2026-10-21";
let n = 0;
const task = (o: Partial<Task>): Task => ({
  id: String(++n), list_id: "L1", parent_id: null, text: "t", notes: "", color: null, tags: [], priority: 0,
  due_date: null, due_time: null, repeat_every: null, repeat_unit: null, completed: false, completed_at: null,
  order_index: n, created_at: "", updated_at: "", ...o,
});
const ids = (ts: Task[]) => ts.map((t) => t.text);

const tasks = [
  task({ text: "late", due_date: "2026-10-19" }),
  task({ text: "today-late", due_date: TODAY, due_time: "17:00" }),
  task({ text: "today-early", due_date: TODAY, due_time: "09:00" }),
  task({ text: "today-untimed-high", due_date: TODAY, priority: 3 }),
  task({ text: "soon", due_date: "2026-10-23", tags: ["Home"] }),
  task({ text: "someday", list_id: "L2" }),
  task({ text: "finished", completed: true, completed_at: "2026-10-20T10:00:00Z" }),
];
const parent = task({ text: "parent" });
const sub = task({ text: "needle-sub", parent_id: parent.id });
const all = [...tasks, parent, sub];

test("today shows overdue and today, timed first, untimed after", () => {
  assert.deepEqual(ids(selectTasks(all, { kind: "today" }, NO_FILTERS, TODAY)), ["late", "today-early", "today-late", "today-untimed-high"]);
});
test("upcoming and all, subtasks never listed alone", () => {
  assert.ok(!ids(selectTasks(all, { kind: "upcoming" }, NO_FILTERS, TODAY)).includes("someday"));
  const every = ids(selectTasks(all, { kind: "all" }, NO_FILTERS, TODAY));
  assert.ok(every.includes("someday") && !every.includes("needle-sub") && !every.includes("finished"));
});
test("list, date and done scopes", () => {
  assert.deepEqual(ids(selectTasks(all, { kind: "list", id: "L2" }, NO_FILTERS, TODAY)), ["someday"]);
  assert.deepEqual(ids(selectTasks(all, { kind: "date", iso: "2026-10-23" }, NO_FILTERS, TODAY)), ["soon"]);
  assert.deepEqual(ids(selectTasks(all, { kind: "done" }, NO_FILTERS, TODAY)), ["finished"]);
});
test("search looks into notes, tags and subtasks; tag and priority filters", () => {
  assert.deepEqual(ids(selectTasks(all, { kind: "all" }, { ...NO_FILTERS, q: "NEEDLE" }, TODAY)), ["parent"]);
  assert.deepEqual(ids(selectTasks(all, { kind: "all" }, { ...NO_FILTERS, tag: "home" }, TODAY)), ["soon"]);
  assert.deepEqual(ids(selectTasks(all, { kind: "all" }, { ...NO_FILTERS, minPriority: 3 }, TODAY)), ["today-untimed-high"]);
});
test("agenda groups overdue first then by day", () => {
  const g = agenda(selectTasks(all, { kind: "upcoming" }, NO_FILTERS, TODAY), TODAY);
  assert.deepEqual(g.map((x) => x.label), ["Overdue", "Today", "Fri 23 Oct"]);
});
test("counts, tags, due state", () => {
  assert.deepEqual(countTasks(all, TODAY), { overdue: 1, today: 3, upcoming: 1, nodate: 2, open: 7, done: 1 });
  assert.deepEqual(tagCounts(all), [{ tag: "Home", n: 1 }]);
  assert.equal(dueState({ due_date: "2026-10-20", completed: false }, TODAY), "overdue");
  assert.equal(dueState({ due_date: TODAY, completed: false }, TODAY), "today");
  assert.equal(dueState({ due_date: "2026-10-22", completed: false }, TODAY), "soon");
  assert.equal(dueState({ due_date: "2026-11-22", completed: true }, TODAY), "none");
});
