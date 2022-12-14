/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/5c1920e50d4b2b80c826ca91aff55c97350bf9f9/packages/@react-aria/menu/src/useMenuSubTrigger.ts
 */

import {
  callHandler,
  combineProps,
  createPolymorphicComponent,
  mergeDefaultProps,
} from "@kobalte/utils";
import { createEffect, JSX, onCleanup, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { createFocusRing, createHover, createPress, isKeyboardFocusVisible } from "../primitives";
import { createSelectableItem } from "../selection";
import { useMenuContext } from "./menu-context";
import { useMenuSubContext } from "./menu-sub-context";
import { useHoverCardContext } from "../hover-card/hover-card-context";

export interface MenuSubTriggerProps {
  /**
   * Optional text used for typeahead purposes.
   * By default, the typeahead behavior will use the .textContent of the Menu.SubTrigger.
   * Use this when the content is complex, or you have non-textual content inside.
   */
  textValue?: string;

  /** Whether the menu sub trigger is disabled. */
  isDisabled?: boolean;
}

export const MenuSubTrigger = createPolymorphicComponent<"div", MenuSubTriggerProps>(props => {
  let ref: HTMLDivElement | undefined;

  const hoverCardContext = useHoverCardContext();
  const menuContext = useMenuContext();
  const context = useMenuSubContext();

  props = mergeDefaultProps(
    {
      as: "div",
      id: menuContext.generateId("sub-trigger"),
    },
    props
  );

  const [local, others] = splitProps(props, ["as", "id", "textValue", "isDisabled"]);

  const selectionManager = () => context.parentMenuContext().listState().selectionManager();

  const isFocused = () => selectionManager().focusedKey() === context.triggerKey();

  const {
    tabIndex,
    dataKey,
    pressHandlers: itemPressHandlers,
    otherHandlers: itemOtherHandlers,
  } = createSelectableItem(
    {
      key: context.triggerKey,
      selectionManager: selectionManager,
      shouldSelectOnPressUp: true,
      allowsDifferentPressOrigin: true,
      isDisabled: () => local.isDisabled,
    },
    () => ref
  );

  const { pressHandlers, isPressed } = createPress({
    isDisabled: () => local.isDisabled,
    onPress: e => {
      if (e.pointerType === "touch" && !menuContext.isOpen() && !local.isDisabled) {
        menuContext.open();
      }
    },
  });

  const { hoverHandlers, isHovered } = createHover({
    isDisabled: () => local.isDisabled,
    onHoverStart: e => {
      if (!isKeyboardFocusVisible()) {
        selectionManager().setFocused(true);
        selectionManager().setFocusedKey(context.triggerKey());
      }

      if (e.pointerType === "touch") {
        return;
      }

      if (!menuContext.isOpen()) {
        menuContext.open();
      }
    },
  });

  const { isFocusVisible, focusRingHandlers } = createFocusRing();

  const onKeyDown: JSX.EventHandlerUnion<any, KeyboardEvent> = e => {
    // Ignore repeating events, which may have started on the menu trigger before moving
    // focus to the menu item. We want to wait for a second complete key press sequence.
    if (e.repeat) {
      return;
    }

    if (local.isDisabled) {
      return;
    }

    // For consistency with native, open the menu on key down.
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowRight":
        e.stopPropagation();
        e.preventDefault();
        if (menuContext.isOpen()) {
          menuContext.focusInPanel();
        } else {
          menuContext.open("first");
        }
        break;
      case "ArrowLeft":
        // The Arrow Left key should always close if it's a sub menu.
        if (!menuContext.isRootMenu()) {
          menuContext.close();
        }
        break;
    }
  };

  const onBlur: JSX.EventHandlerUnion<any, FocusEvent> = e => {
    const relatedTarget = e.relatedTarget as Node | undefined;

    // Don't close if the hovercard element (or nested ones) has focus within.
    if (hoverCardContext.isTargetOnHoverCard(relatedTarget)) {
      return;
    }

    menuContext.close();
  };

  createEffect(() => onCleanup(menuContext.registerTrigger(local.id!)));

  createEffect(() => {
    if (local.isDisabled) {
      return;
    }

    const unregister = context.registerSubTriggerToParent({
      ref: () => ref,
      key: context.triggerKey(),
      label: local.textValue ?? ref?.textContent ?? "",
      textValue: local.textValue ?? ref?.textContent ?? "",
      disabled: local.isDisabled,
    });

    onCleanup(unregister);
  });

  return (
    <Dynamic
      component={local.as}
      id={local.id}
      role="menuitem"
      tabIndex={tabIndex()}
      aria-haspopup="true"
      aria-expanded={menuContext.isOpen()}
      aria-controls={menuContext.isOpen() ? menuContext.panelId() : undefined}
      aria-disabled={local.isDisabled}
      data-key={dataKey()}
      data-expanded={menuContext.isOpen() ? "" : undefined}
      data-disabled={local.isDisabled ? "" : undefined}
      data-hover={isHovered() ? "" : undefined}
      data-focus={isFocused() ? "" : undefined}
      data-focus-visible={isFocusVisible() ? "" : undefined}
      data-active={isPressed() ? "" : undefined}
      {...combineProps(
        {
          ref: el => {
            menuContext.setTriggerRef(el);
            ref = el;
          },
        },
        others,
        itemPressHandlers,
        itemOtherHandlers,
        pressHandlers,
        hoverHandlers,
        focusRingHandlers,
        { onKeyDown, onBlur }
      )}
    />
  );
});
