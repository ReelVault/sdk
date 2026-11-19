import { describe, expect, test } from "bun:test";
import { defineConfig, field } from "./config";

const HTTPS_URL = /^https:\/\//;

describe("plugin configuration parsing", () => {
	const config = defineConfig({
		webhookUrl: field.string({ label: "Webhook", pattern: HTTPS_URL, minLength: 12 }),
		token: field.string({ label: "Token", required: true, minLength: 8 }),
	});

	test("an optional field the admin left empty parses as unset instead of failing its format", () => {
		expect(config.parse({ webhookUrl: "", token: "abcdefgh" })).toEqual({ webhookUrl: undefined, token: "abcdefgh" });
	});

	test("a filled optional field still has to match its format", () => {
		expect(() => config.parse({ webhookUrl: "http://plain", token: "abcdefgh" })).toThrow("does not match the expected format");
	});

	test("a required field left empty is still refused", () => {
		expect(() => config.parse({ webhookUrl: "", token: "" })).toThrow("shorter than 8 characters");
	});
});
