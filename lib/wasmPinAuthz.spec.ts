/**
 * @jest-environment node
 */
import { AminoTypes } from "@cosmjs/stargate";
import { MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { MsgPinCodes, MsgUnpinCodes } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import {
  MsgExecTypeUrl,
  MsgPinCodesTypeUrl,
  MsgUnpinCodesTypeUrl,
  NYX_WASM_AUTHORITY,
  createAuthzExecPinAminoConverters,
  createWasmPinAminoConverters,
  makeAuthzPinCodesMsg,
  makeAuthzUnpinCodesMsg,
  parseCodeIdsInput,
} from "./wasmPinAuthz";

const aminoTypes = new AminoTypes({
  ...createWasmPinAminoConverters(),
  ...createAuthzExecPinAminoConverters(),
});

describe("parseCodeIdsInput", () => {
  it("parses comma and space separated ids", () => {
    expect(parseCodeIdsInput("78, 79")).toEqual([78n, 79n]);
    expect(parseCodeIdsInput("78 79")).toEqual([78n, 79n]);
  });

  it("rejects invalid input", () => {
    expect(parseCodeIdsInput("")).toBeNull();
    expect(parseCodeIdsInput("0")).toBeNull();
    expect(parseCodeIdsInput("-1")).toBeNull();
    expect(parseCodeIdsInput("78.5")).toBeNull();
  });
});

describe("authz pin/unpin amino", () => {
  it("round-trips MsgPinCodes through amino", () => {
    const msg = {
      typeUrl: MsgPinCodesTypeUrl,
      value: MsgPinCodes.fromPartial({
        authority: NYX_WASM_AUTHORITY,
        codeIds: [78n, 79n],
      }),
    };

    const amino = aminoTypes.toAmino(msg);
    expect(amino).toEqual({
      type: "wasm/MsgPinCodes",
      value: {
        authority: NYX_WASM_AUTHORITY,
        code_ids: ["78", "79"],
      },
    });

    expect(aminoTypes.fromAmino(amino)).toEqual(msg);
  });

  it("round-trips MsgUnpinCodes through amino", () => {
    const msg = {
      typeUrl: MsgUnpinCodesTypeUrl,
      value: MsgUnpinCodes.fromPartial({
        authority: NYX_WASM_AUTHORITY,
        codeIds: [78n],
      }),
    };

    const amino = aminoTypes.toAmino(msg);
    expect(amino).toEqual({
      type: "wasm/MsgUnpinCodes",
      value: {
        authority: NYX_WASM_AUTHORITY,
        code_ids: ["78"],
      },
    });

    expect(aminoTypes.fromAmino(amino)).toEqual(msg);
  });

  it("round-trips authz-wrapped pin through amino with cosmos-sdk MsgExec shape", () => {
    const encodeObject = makeAuthzPinCodesMsg(
      "n1txe3x04c3wjejfn4my4ef3n4t4dfhfajcwqg9t",
      NYX_WASM_AUTHORITY,
      [79n],
    );

    expect(encodeObject.typeUrl).toBe(MsgExecTypeUrl);

    const amino = aminoTypes.toAmino(encodeObject);
    expect(amino).toEqual({
      type: "cosmos-sdk/MsgExec",
      value: {
        grantee: "n1txe3x04c3wjejfn4my4ef3n4t4dfhfajcwqg9t",
        msgs: [
          {
            type: "wasm/MsgPinCodes",
            value: {
              authority: NYX_WASM_AUTHORITY,
              code_ids: ["79"],
            },
          },
        ],
      },
    });

    const roundTripped = aminoTypes.fromAmino(amino);
    expect(roundTripped.typeUrl).toBe(MsgExecTypeUrl);

    const exec = roundTripped.value as MsgExec;
    expect(exec.grantee).toBe("n1txe3x04c3wjejfn4my4ef3n4t4dfhfajcwqg9t");
    expect(exec.msgs).toHaveLength(1);
    expect(exec.msgs[0].typeUrl).toBe(MsgPinCodesTypeUrl);
    expect(MsgPinCodes.decode(exec.msgs[0].value)).toEqual({
      authority: NYX_WASM_AUTHORITY,
      codeIds: [79n],
    });
  });

  it("round-trips authz-wrapped unpin through amino", () => {
    const encodeObject = makeAuthzUnpinCodesMsg(
      "n1txe3x04c3wjejfn4my4ef3n4t4dfhfajcwqg9t",
      NYX_WASM_AUTHORITY,
      [78n],
    );

    const amino = aminoTypes.toAmino(encodeObject);
    expect(amino.type).toBe("cosmos-sdk/MsgExec");
    expect(amino.value.msgs[0].type).toBe("wasm/MsgUnpinCodes");

    const roundTripped = aminoTypes.fromAmino(amino);
    const exec = roundTripped.value as MsgExec;
    expect(MsgUnpinCodes.decode(exec.msgs[0].value)).toEqual({
      authority: NYX_WASM_AUTHORITY,
      codeIds: [78n],
    });
  });

  it("round-trips MsgExec through cosmjs-types JSON (DB persistence)", () => {
    const encodeObject = makeAuthzUnpinCodesMsg(
      "n1txe3x04c3wjejfn4my4ef3n4t4dfhfajcwqg9t",
      NYX_WASM_AUTHORITY,
      [78n],
    );

    const json = MsgExec.toJSON(encodeObject.value as MsgExec);
    const restored = MsgExec.fromJSON(json);
    expect(MsgUnpinCodes.decode(restored.msgs[0].value).codeIds).toEqual([78n]);
  });
});
