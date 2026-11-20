import { forwardRef, type ForwardRefExoticComponent, type PropsWithoutRef, type RefAttributes } from "react";

// "Inheritance" for components. React favours composition over class hierarchies, and this is how to get the same result: a specialised
// component is a base component with some of its settings fixed. It inherits everything the base does (props, ref, accessibility,
// styling), and can still be given any prop the base accepts, which wins over the fixed one.
//
//   const IconButton = extend(Button, { variant: "ghost", size: "icon" }, "IconButton");
//
// Change the base, and every component built on it changes with it.
export function extend<Props extends object, Instance>(
  Base: ForwardRefExoticComponent<Props & RefAttributes<Instance>>,
  fixed: Partial<Props>,
  name: string,
): ForwardRefExoticComponent<Props & RefAttributes<Instance>> {
  const Derived = forwardRef<Instance, PropsWithoutRef<Props>>(function Derived(props, ref) {
    return <Base {...(fixed as Props)} {...(props as Props)} ref={ref} />;
  });
  Derived.displayName = name;
  return Derived as unknown as ForwardRefExoticComponent<Props & RefAttributes<Instance>>;
}
