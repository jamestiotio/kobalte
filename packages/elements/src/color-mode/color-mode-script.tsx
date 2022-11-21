/*!
 * Portions of this file are based on code from chakra-ui.
 * MIT Licensed, Copyright (c) 2019 Segun Adebayo.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/chakra-ui/blob/132a98958be64e46619b1e280ca6405d0a833cb0/packages/components/color-mode/src/color-mode-script.tsx
 */

import { createMemo, createSignal, mergeProps } from "solid-js";

import { COLOR_MODE_STORAGE_KEY } from "./storage-manager";
import { ColorModeScriptProps, ConfigColorMode } from "./types";

const FALLBACK_VALUE: ConfigColorMode = "system";

const VALID_VALUES = new Set<ConfigColorMode>(["light", "dark", "system"]);

/**
 * runtime safe-guard against invalid color mode values
 */
function normalize(initialColorMode: ConfigColorMode) {
  if (!VALID_VALUES.has(initialColorMode)) {
    return FALLBACK_VALUE;
  }

  return initialColorMode;
}

/** Globally managed initial color mode. */
const [initialColorMode, setInitialColorMode] = createSignal<ConfigColorMode>(FALLBACK_VALUE);

export { initialColorMode };

export function ColorModeScript(props: ColorModeScriptProps) {
  props = mergeProps(
    {
      initialColorMode: FALLBACK_VALUE,
      storageType: "localStorage",
      storageKey: COLOR_MODE_STORAGE_KEY,
    } as ColorModeScriptProps,
    props
  );

  setInitialColorMode(normalize(props.initialColorMode!));

  const scriptSrc = createMemo(() => {
    // runtime safe-guard against invalid color mode values
    const init = initialColorMode();

    const cookieScript = `(function(){try{var a=function(o){var l="(prefers-color-scheme: dark)",v=window.matchMedia(l).matches?"dark":"light",e=o==="system"?v:o,d=document.documentElement,s=e==="dark";return d.style.colorScheme=e,d.dataset.kbTheme=e,o},u=a,h="${init}",r="${props.storageKey}",t=document.cookie.match(new RegExp("(^| )".concat(r,"=([^;]+)"))),c=t?t[2]:null;c?a(c):document.cookie="".concat(r,"=").concat(a(h),"; max-age=31536000; path=/")}catch(a){}})();`;

    const localStorageScript = `(function(){try{var a=function(c){var v="(prefers-color-scheme: dark)",h=window.matchMedia(v).matches?"dark":"light",r=c==="system"?h:c,o=document.documentElement,i=r==="dark";return o.style.colorScheme=r,o.dataset.kbTheme=r,c},n=a,m="${init}",e="${props.storageKey}",t=localStorage.getItem(e);t?a(t):localStorage.setItem(e,a(m))}catch(a){}})();`;

    const fn = props.storageType === "cookie" ? cookieScript : localStorageScript;

    return `!${fn}`.trim();
  });

  // eslint-disable-next-line solid/no-innerhtml
  return <script id="kb-color-mode-script" nonce={props.nonce} innerHTML={scriptSrc()} />;
}
