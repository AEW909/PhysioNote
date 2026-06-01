"use client";

import type { FocusAssetOption } from "@/lib/focus-board/assets";

type FocusImageSelectProps = {
  assets: FocusAssetOption[];
  label: string;
  name?: string;
  value: string;
  onChange?: (value: string) => void;
};

export function FocusImageSelect({ assets, label, name, value, onChange }: FocusImageSelectProps) {
  const hasCurrentValue = assets.some((asset) => asset.value === value);
  const selectValueProps = onChange ? { value } : { defaultValue: value };

  return (
    <label className="field focus-image-select-field">
      <span>{label}</span>
      <select
        className="select-field"
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        {...selectValueProps}
      >
        {!hasCurrentValue && value ? <option value={value}>{value}</option> : null}
        {assets.map((asset) => (
          <option key={`${asset.source}:${asset.value}`} value={asset.value}>
            {asset.label} {asset.source === "uploaded" ? "(uploaded)" : ""}
          </option>
        ))}
      </select>
      {value ? (
        <span className="focus-image-select-preview">
          <img alt="" src={value} />
          <span>{value}</span>
        </span>
      ) : null}
    </label>
  );
}
