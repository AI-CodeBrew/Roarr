import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockStack, Box, Button, InlineStack, Popover, Text, TextField } from '@shopify/polaris';

function normalizeValue(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

export default function EditableText({
  enabled = false,
  label = 'Text',
  badge = 'Text',
  value = '',
  onSave,
  children,
}) {
  const initial = useMemo(() => normalizeValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);

  const handleUpdate = useCallback(() => {
    if (typeof onSave === 'function') onSave(draft);
    setOpen(false);
  }, [draft, onSave]);

  useEffect(() => {
    if (!open) setDraft(initial);
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleUpdate();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, handleUpdate]);

  const child = React.Children.only(children);
  const childStyle = child?.props?.style || {};
  const childClassName = child?.props?.className || '';

  const trigger = React.cloneElement(child, {
    className: enabled ? `${childClassName} hb-editable-wrap` : childClassName,
    style: enabled
      ? { ...childStyle, position: 'relative', cursor: 'pointer' }
      : childStyle,
    onClick: (e) => {
      if (!enabled) return child?.props?.onClick?.(e);
      e.preventDefault();
      e.stopPropagation();
      setOpen((prev) => !prev);
    },
    children: enabled ? (
      <>
        {child.props.children}
        {/* Expand overlay bounds so the dashed outline has padding */}
        <span className="hb-editable-overlay" aria-hidden="true" style={{ inset: '-6px' }} />
        <span className="hb-editable-badge" aria-hidden="true" style={{ top: '-12px', left: '3px' }}>
          {badge}
        </span>
      </>
    ) : (
      child.props.children
    ),
  });

  return (
    <>
      <Popover
        active={open && enabled}
        activator={trigger}
        onClose={() => setOpen(false)}
        preferredPosition="below"
        preferredAlignment="left"
        autofocusTarget="first-node"
      >
        <Popover.Pane fixed>
          <Box padding="300" minWidth="320px" maxWidth="420px">
            <BlockStack gap="300">
              <Text as="p" variant="bodySm" fontWeight="medium">
                {label}
              </Text>
              <TextField
                label={label}
                labelHidden
                value={draft}
                onChange={setDraft}
                multiline={4}
                autoComplete="off"
              />
              <InlineStack align="end" gap="200" blockAlign="center">
                <Text as="span" variant="bodyXs" tone="subdued">
                  Ctrl/⌘ + Enter to update
                </Text>
                <InlineStack gap="200">
                  <Button
                    onClick={() => {
                      setDraft(initial);
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleUpdate}>
                    update
                  </Button>
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Popover.Pane>
      </Popover>
    </>
  );
}

