import { parse } from "https://deno.land/x/swc@0.2.1/mod.ts";

type FieldDef = {
	name: string;
	optional?: boolean;
	type?: FieldType;
};

type FieldType = {
	name?: string;
	elementType?: FieldType;
	elementSize?: number;
	sizeType?: FieldType;
	size?: number;
	padding?: number;
	fields?: Array<[string, FieldType]>;
	raw?: boolean;
};

type Structure = {
	name: string;
	opcode?: number;
	fields: Array<FieldDef>;
};

async function getAST(path: string) {
	const code = await Deno.readTextFile(path);
	return parse(code, {
		target: "es2019",
		syntax: "typescript",
		comments: false,
	});
}

function ensureOptionalField(obj) {
	return obj.type === "IfStatement" && obj.test.type === "CallExpression" &&
		obj.test.callee.type === "MemberExpression" &&
		obj.test.callee.object.value === "reader" &&
		obj.test.callee.property.value === "bool";
}

function getSubFields(node) {
	let fields: Array<[string, FieldType]> = [];
	for (const item of node.stmts) {
		if (
			item.type === "VariableDeclaration" || item.type === "ReturnStatement"
		) {
			continue;
		}

		if (item.expression.type !== "AssignmentExpression") {
			throw new Error(`expected assignemnet expr in sub read`);
		}

		const name = item.expression.left.property.value;
		const type = getFieldType(item.expression.right);

		fields.push([name, type]);
	}
	return fields;
}

function getFieldType(node): FieldType {
	if (node.type === "CallExpression" && node.callee.object.value !== "reader") {
		return {
			name: node.callee.object.value,
			raw: true,
		};
	} else if (node.type !== "CallExpression") {
		throw new Error("expected a reader call expression");
	}

	const result: FieldType = {};
	result.name = node.callee.property.value;
	const args = node.arguments;

	if (result.name === "array") {
		const [sizeType, subReader] = args;
		result.sizeType = getFieldType(sizeType.expression);

		if (subReader.expression.type !== "ArrowFunctionExpression") {
			throw new Error(`expected arrow function`);
		}

		if (subReader.expression.body.type === "BlockStatement") {
			result.elementType = {
				fields: getSubFields(subReader.expression.body),
			};
		} else if (subReader.expression.body.type === "CallExpression") {
			result.elementType = getFieldType(subReader.expression.body);
		} else {
			throw new Error(`unexpected expr ${subReader.expression.body.type}`);
		}
	} else if (result.name === "bytes") {
		if (args.length === 3) {
			const [subType, maxLength, elementSize] = args;

			result.sizeType = getFieldType(subType.expression);
			result.elementSize = elementSize.expression.value;
		} else if (args.length > 0 && args.length < 3) {
			if (args[0].expression.type === "NumericLiteral") {
				result.size = args[0].expression.value;
			} else {
				result.sizeType = getFieldType(args[0].expression);
			}
		} else {
			throw new Error(`invalid bytes call has ${args.length} arguments`);
		}
	}

	return result;
}

function getFieldDef(node): FieldDef {
	if (node.expression.type === "CallExpression") {
		if (
			node.expression.callee.object.value !== "reader" ||
			node.expression.callee.property.value !== "skip"
		) {
			throw new Error(`expected skip but got something else throwaway`);
		}

		return {
			name: "",
			type: {
				padding: node.expression.arguments[0].expression.value,
			},
		};
	}

	if (node.expression.type !== "AssignmentExpression") {
		console.log(node.expression);
		throw new Error("unk expression");
	}

	if (node.expression.left.object.value !== "data") {
		console.log(node.expression.left);
		throw new Error("not assigning to data");
	}

	let field: FieldDef = {
		name: node.expression.left.property.value,
		type: getFieldType(node.expression.right),
	};

	return field;
}

function convertPacketReader(readerFnDef) {
	const [dataDef, ...body] = readerFnDef.body.stmts;

	const fields: Array<FieldDef> = [];

	for (const node of body) {
		if (node.type === "IfStatement") {
			// make sure this if statement is actually an optional field
			if (!ensureOptionalField(node)) {
				console.log(node);
				throw new Error(
					`Expected optional field, but didn't match requirements: ${node}`,
				);
			}

			if (node.consequent.type === "BlockStatement") {
				let subFields = getSubFields(node.consequent);

				let field = {
					name: subFields[0][0],
					type: {
						fields: subFields,
					},
					optional: true,
				};
				fields.push(field);
			} else {
				let field = getFieldDef(node.consequent);
				field.optional = true;
				fields.push(field);
			}
		} else if (node.type === "ExpressionStatement") {
			fields.push(getFieldDef(node));
		} else if (
			node.type === "ReturnStatement" || node.type === "VariableDeclaration"
		) {
			continue;
		} else {
			console.log(`Error: unprocessed node ${node.type}`);
		}
	}

	return fields;
}

async function convertPacket(path: string): Promise<Structure> {
	const ast = await getAST(path);
	let opcode = 0;
	let fields: Array<FieldDef> = [];
	let name = "";

	for (const node of ast.body) {
		if (node.type === "ExportDeclaration") {
			if (node.declaration.type === "TsTypeAliasDeclaration") {
				name = node.declaration.id.value;
			} else if (
				node.declaration.type === "FunctionDeclaration" &&
				node.declaration.identifier.value === "read"
			) {
				fields = convertPacketReader(node.declaration);
			} else if (node.declaration.type === "VariableDeclaration") {
				for (const decl of node.declaration.declarations) {
					if (
						decl.id.value === "opcode" && decl.init.type === "NumericLiteral"
					) {
						opcode = decl.init.value;
					} else if (decl.id.value === "name") {
						name = decl.init.value;
					}
				}
			}
		}
	}

	return {
		name: name,
		opcode: opcode,
		fields: fields,
	};
}

const typeMap = {
	"u8": "uint8",
	"u16": "uint16",
	"u32": "uint32",
	"u64": "uint64",
	"i8": "byte",
	"i16": "int16",
	"i32": "int32",
	"i64": "int64",
	"string": "string",
	"bool": "bool",
	"ReadNBytesInt64": "NBytesInt64",
	"f32": "float32",
	"f64": "float64",
};

function toGoType(type: FieldType) {
	if (type.padding !== undefined) {
		return `[${type.padding}]byte`;
	}

	if (type.fields) {
		let parts: Array<string> = [];
		parts.push("struct {");
		for (const [name, fieldType] of type.fields) {
			parts.push(`${toGoFieldName(name)} ${toGoType(fieldType)}`);
		}
		parts.push("}");
		return parts.join("\n");
	}

	if (type.name === "bytes") {
		if (type.sizeType) {
			const size = toGoType(type.sizeType);
			if (type.elementSize !== undefined) {
				return `Array[${size}, [${type.elementSize}]byte]`;
			} else {
				return `ByteArray[${size}]`;
			}
		} else if (type.size) {
			if (type.elementSize !== undefined) {
				return `[${type.elementSize}][${type.elementSize}]byte`;
			} else {
				return `[${type.size}]byte`;
			}
		} else {
			throw new Error("bad bytes field type def");
		}
	} else if (type.name === "array") {
		if (type.sizeType && type.elementType) {
			return `Array[${toGoType(type.sizeType!!)}, ${toGoType(type.elementType!!)
				}]`;
		}
	} else if (typeMap[type.name!!] !== undefined) {
		return typeMap[type.name!!];
	} else if (type.raw) {
		return type.name;
	} else {
		console.log(type);
		throw new Error(`unhandled go type: ${type.name}`);
	}
}

function toGoFieldName(name) {
	return (name.charAt(0).toUpperCase() + name.slice(1));
}

function formatStructure(struct: Structure) {
	let paddingId = 0;
	let fields: Array<string> = [];

	for (const field of struct.fields) {
		let prefix = field.optional === true ? "*" : "";

		if (field.name === "") {
			field.name = `Padding${paddingId}`;
			paddingId += 1;
		}

		fields.push(
			`  ${toGoFieldName(field.name)} ${prefix}${toGoType(field.type!!)}`,
		);
	}

	let parts = [
		`type ${struct.name} struct {`,
		...fields,
		`}`,
	];

	return parts.join("\n");
}

const patches: Array<[string, string, Partial<FieldDef>]> = [
	// meter decodes these as u32 and then parses them into float, but we can just read them as normal float32's
	["PCStruct", "GearLevel", { type: { name: "f32" } }],
	["PKTInitPC", "GearLevel", { type: { name: "f32" } }],
	["PartyMemberData", "GearLevel", { type: { name: "f32" } }],

	// meter has this as a *[16]byte, but we can just decode it as *uint16 plus 14 bytes of padding
	[
		"StatusEffectData",
		"Value",
		{
			type: {
				size: undefined,
				elementType: undefined,
				fields: [
					["Data", { name: "u16" }],
					["Padding", { padding: 14 }],
				],
			},
		},
	],
];

async function main() {
	const structures: Record<string, Structure> = {};
	const meterCorePath = Deno.args.length > 0 ? Deno.args[0] : "../meter-core"

	// process all structures
	for await (
		const dirEntry of Deno.readDir(
			`${meterCorePath}/src/packets/generated/structures/`,
		)
	) {
		if (dirEntry.isFile) {
			console.log(`PROCESSING structures/${dirEntry.name}`);
			const struct = await convertPacket(
				`${meterCorePath}/src/packets/generated/structures/${dirEntry.name}`,
			);
			structures[struct.name] = struct;
		}
	}

	// process all packets
	for await (
		const dirEntry of Deno.readDir(
			`${meterCorePath}/src/packets/generated/definitions/`,
		)
	) {
		if (dirEntry.isFile) {
			console.log(`PROCESSING definitions/${dirEntry.name}`);
			const struct = await convertPacket(
				`${meterCorePath}/src/packets/generated/definitions/${dirEntry.name}`,
			);
			structures[struct.name] = struct;
		}
	}

	// apply patches
	for (const [typeName, fieldName, patch] of patches) {
		const existing = structures[typeName];
		if (existing === undefined) {
			throw new Error(`invalid patch for ${typeName}`);
		}

		let found = false;
		for (const idx in existing.fields) {
			const field = existing.fields[idx];

			if (field.name === fieldName) {
				existing.fields[idx] = { ...field, ...patch };
				found = true;
				break;
			}
		}

		if (!found) {
			throw new Error(`invalid patch ${typeName} / ${fieldName}`);
		}
	}

	const parts: Array<string> = [
		"// Code generated by generate-packets.ts. DO NOT EDIT.",
		"",
		"package protocol",
		'import "reflect"',
	];
	const opCodeInit: Array<string> = [];

	// write structures
	for (const struct of Object.values(structures)) {
		parts.push(formatStructure(struct));

		if (struct.opcode) {
			opCodeInit.push(
				`  OpCodeToPacket[${struct.opcode}] = reflect.TypeOf(${struct.name}{})`,
			);
		}
	}

	// write opcode registration
	parts.push("func init() {");
	parts.push(opCodeInit.join("\n"));
	parts.push("}");

	// write and format generated file
	await Deno.writeTextFile("protocol/generated.go", parts.join("\n\n"));
	await Deno.run({ cmd: ["go", "fmt", "protocol/generated.go"] }).status();
}

await main();
