import { test } from "node:test";
import assert from "node:assert/strict";
import { REGIONS, regionFromLocale } from "./region.ts";

test("the country comes from the browser's language setting", () => {
  assert.equal(regionFromLocale("vi-VN"), "VN");
  assert.equal(regionFromLocale("en-GB"), "GB");
  assert.equal(regionFromLocale("ja_jp"), "JP");
  assert.equal(regionFromLocale("fil-PH-x"), "US", "a country that is not offered falls back");
});

test("nothing usable falls back to the United States", () => {
  for (const input of [undefined, "", "en", "xx", "<script>", "en-", "-US"]) assert.equal(regionFromLocale(input), "US", String(input));
});

test("every offered country is two capital letters, once", () => {
  assert.equal(new Set(REGIONS.map(([code]) => code)).size, REGIONS.length);
  for (const [code, name] of REGIONS) {
    assert.match(code, /^[A-Z]{2}$/);
    assert.ok(name.length > 2);
  }
});
