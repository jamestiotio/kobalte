import { ComponentProps, Show } from "solid-js";
import { Portal } from "solid-js/web";

import { useDialogContext } from "./dialog-context";

/**
 * Portals its children into the `body` when the dialog is open.
 */
export function DialogPortal(props: ComponentProps<typeof Portal>) {
  const context = useDialogContext();

  return (
    <Show when={context.shouldMount()}>
      <Portal {...props} />
    </Show>
  );
}
