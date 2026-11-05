import { AminoMsg } from "@cosmjs/amino";
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing";
import { AminoConverters } from "@cosmjs/stargate";
import { MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { MsgPinCodes, MsgUnpinCodes } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";

/** Nyx gov module account - wasm authority for MsgPinCodes / MsgUnpinCodes. */
export const NYX_WASM_AUTHORITY = "n10d07y265gmmuvt4z0w9aw880jnsr700jgxy8fk";

export const MsgPinCodesTypeUrl = "/cosmwasm.wasm.v1.MsgPinCodes";
export const MsgUnpinCodesTypeUrl = "/cosmwasm.wasm.v1.MsgUnpinCodes";
export const MsgExecTypeUrl = "/cosmos.authz.v1beta1.MsgExec";

export const wasmPinTypes: ReadonlyArray<[string, GeneratedType]> = [
  [MsgPinCodesTypeUrl, MsgPinCodes],
  [MsgUnpinCodesTypeUrl, MsgUnpinCodes],
];

type PinAminoValue = {
  readonly authority: string;
  readonly code_ids: readonly string[];
};

const pinToAmino = (msg: MsgPinCodes): AminoMsg => ({
  type: "wasm/MsgPinCodes",
  value: {
    authority: msg.authority,
    // cosmos-sdk amino encodes uint64 as strings (same as cosmjs MsgMigrateContract code_id)
    code_ids: msg.codeIds.map((id) => id.toString()),
  } satisfies PinAminoValue,
});

const unpinToAmino = (msg: MsgUnpinCodes): AminoMsg => ({
  type: "wasm/MsgUnpinCodes",
  value: {
    authority: msg.authority,
    code_ids: msg.codeIds.map((id) => id.toString()),
  } satisfies PinAminoValue,
});

const pinFromAmino = (value: PinAminoValue): MsgPinCodes =>
  MsgPinCodes.fromPartial({
    authority: value.authority,
    codeIds: value.code_ids.map((id) => BigInt(id)),
  });

const unpinFromAmino = (value: PinAminoValue): MsgUnpinCodes =>
  MsgUnpinCodes.fromPartial({
    authority: value.authority,
    codeIds: value.code_ids.map((id) => BigInt(id)),
  });

const toAnyPin = (msg: MsgPinCodes): Any =>
  Any.fromPartial({
    typeUrl: MsgPinCodesTypeUrl,
    value: MsgPinCodes.encode(msg).finish(),
  });

const toAnyUnpin = (msg: MsgUnpinCodes): Any =>
  Any.fromPartial({
    typeUrl: MsgUnpinCodesTypeUrl,
    value: MsgUnpinCodes.encode(msg).finish(),
  });

export const createWasmPinAminoConverters = (): AminoConverters => ({
  [MsgPinCodesTypeUrl]: {
    aminoType: "wasm/MsgPinCodes",
    toAmino: ({ authority, codeIds }: MsgPinCodes): PinAminoValue => ({
      authority,
      code_ids: codeIds.map((id) => id.toString()),
    }),
    fromAmino: (value: PinAminoValue): MsgPinCodes => pinFromAmino(value),
  },
  [MsgUnpinCodesTypeUrl]: {
    aminoType: "wasm/MsgUnpinCodes",
    toAmino: ({ authority, codeIds }: MsgUnpinCodes): PinAminoValue => ({
      authority,
      code_ids: codeIds.map((id) => id.toString()),
    }),
    fromAmino: (value: PinAminoValue): MsgUnpinCodes => unpinFromAmino(value),
  },
});

// cosmjs leaves authz amino as "IMPLEMENT ME"; Keplr/Ledger signing here is amino-only.
export const createAuthzExecPinAminoConverters = (): AminoConverters => ({
  [MsgExecTypeUrl]: {
    aminoType: "cosmos-sdk/MsgExec",
    toAmino: ({ grantee, msgs }: MsgExec) => ({
      grantee,
      msgs: msgs.map((anyMsg) => {
        if (anyMsg.typeUrl === MsgPinCodesTypeUrl) {
          return pinToAmino(MsgPinCodes.decode(anyMsg.value));
        }
        if (anyMsg.typeUrl === MsgUnpinCodesTypeUrl) {
          return unpinToAmino(MsgUnpinCodes.decode(anyMsg.value));
        }
        throw new Error(
          `Unsupported MsgExec inner type for amino signing: ${anyMsg.typeUrl}. Only MsgPinCodes and MsgUnpinCodes are supported.`,
        );
      }),
    }),
    fromAmino: ({
      grantee,
      msgs,
    }: {
      grantee: string;
      msgs: readonly AminoMsg[];
    }): MsgExec => ({
      grantee,
      msgs: msgs.map((aminoMsg) => {
        if (aminoMsg.type === "wasm/MsgPinCodes") {
          return toAnyPin(pinFromAmino(aminoMsg.value as PinAminoValue));
        }
        if (aminoMsg.type === "wasm/MsgUnpinCodes") {
          return toAnyUnpin(unpinFromAmino(aminoMsg.value as PinAminoValue));
        }
        throw new Error(
          `Unsupported MsgExec amino type: ${aminoMsg.type}. Only wasm/MsgPinCodes and wasm/MsgUnpinCodes are supported.`,
        );
      }),
    }),
  },
});

export const makeAuthzPinCodesMsg = (
  grantee: string,
  authority: string,
  codeIds: readonly bigint[],
): EncodeObject => ({
  typeUrl: MsgExecTypeUrl,
  value: MsgExec.fromPartial({
    grantee,
    msgs: [
      toAnyPin(
        MsgPinCodes.fromPartial({
          authority,
          codeIds: [...codeIds],
        }),
      ),
    ],
  }),
});

export const makeAuthzUnpinCodesMsg = (
  grantee: string,
  authority: string,
  codeIds: readonly bigint[],
): EncodeObject => ({
  typeUrl: MsgExecTypeUrl,
  value: MsgExec.fromPartial({
    grantee,
    msgs: [
      toAnyUnpin(
        MsgUnpinCodes.fromPartial({
          authority,
          codeIds: [...codeIds],
        }),
      ),
    ],
  }),
});

export const parseCodeIdsInput = (raw: string): bigint[] | null => {
  const parts = raw
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const codeIds: bigint[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part) || !Number.isSafeInteger(Number(part)) || Number(part) <= 0) {
      return null;
    }
    codeIds.push(BigInt(part));
  }
  return codeIds;
};
