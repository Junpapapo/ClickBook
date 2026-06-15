const breakpoints = ["40em", "52em", "64em"];

const defaultTheme = {
  breakpoints,
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: ["10px", "12px", "14px", "16px", "20px", "24px", "32px", "40px", "48px", "64px"],
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    solid: 1,
    title: 1.25,
    copy: 1.5,
  },
  letterSpacings: {
    normal: "normal",
    tracked: "0.1em",
  },
  colors: {
    primary: "rgb(235, 12, 116)",
    primaryDark: "rgb(173, 8, 85)",
    primaryLight: "rgb(243, 89, 161)",
    success: "#5cb85c",
    warning: "#f0ad4e",
    danger: "#d9534f",
    info: "#5bc0de",
    dark: "#292b2c",
    light: "#f7f7f7",
    white: "#fff",
    black: "#000",
    blue: "#007bff",
    gray: "#ccc",
    grayLight: "#eee",
    grayDark: "#666"
  },
  borders: [0, "1px solid", "2px solid"],
  radii: ["0", "2px", "4px", "8px", "16px", "32px", "50%", "9999px"],
  width: [16, 32, 64, 128, 256],
  heights: [16, 32, 64, 128, 256],
  minWidths: [16, 32, 64, 128, 256],
  minHeights: [16, 32, 64, 128, 256],
  maxWidths: [16, 32, 64, 128, 256],
  maxHeights: [16, 32, 64, 128, 256]
};

const aliases = {
  bg: "backgroundColor",
  m: "margin",
  mt: "marginTop",
  mr: "marginRight",
  mb: "marginBottom",
  ml: "marginLeft",
  mx: "marginX",
  my: "marginY",
  p: "padding",
  pt: "paddingTop",
  pr: "paddingRight",
  pb: "paddingBottom",
  pl: "paddingLeft",
  px: "paddingX",
  py: "paddingY",
};

const properties = {
  color: true,
  backgroundColor: true,
  fontFamily: true,
  fontSize: true,
  fontWeight: true,
  lineHeight: true,
  letterSpacing: true,
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  border: true,
  borderTop: true,
  borderRight: true,
  borderBottom: true,
  borderLeft: true,
  borderColor: true,
  borderRadius: true,
  boxShadow: true,
  width: true,
  height: true,
  minWidth: true,
  minHeight: true,
  maxWidth: true,
  maxHeight: true,
  display: true,
  alignItems: true,
  justifyContent: true,
  flexDirection: true,
  flexWrap: true,
  flex: true,
  alignSelf: true,
  position: true,
  top: true,
  right: true,
  bottom: true,
  left: true,
  zIndex: true,
  overflow: true,
  cursor: true,
  transition: true,
  transform: true,
  opacity: true,
};

const scaleMaps = {
  color: "colors",
  backgroundColor: "colors",
  borderColor: "colors",
  fontSize: "fontSizes",
  fontWeight: "fontWeights",
  lineHeight: "lineHeights",
  letterSpacing: "letterSpacings",
  margin: "space",
  marginTop: "space",
  marginRight: "space",
  marginBottom: "space",
  marginLeft: "space",
  padding: "space",
  paddingTop: "space",
  paddingRight: "space",
  paddingBottom: "space",
  paddingLeft: "space",
  border: "borders",
  borderTop: "borders",
  borderRight: "borders",
  borderBottom: "borders",
  borderLeft: "borders",
  borderRadius: "radii",
  boxShadow: "shadows",
  width: "width",
  height: "heights",
  minWidth: "minWidths",
  minHeight: "minHeights",
  maxWidth: "maxWidths",
  maxHeight: "maxHeights"
};

const isObject = (val) => val && typeof val === "object" && !Array.isArray(val);

const getThemeValue = (theme, scale, val) => {
  if (!theme || !scale) return val;
  const themeScale = theme[scale];
  if (!themeScale) return val;

  if (Array.isArray(themeScale)) {
    if (typeof val === "number" && val >= 0 && val < themeScale.length) {
      return themeScale[val];
    }
    return val;
  }

  if (isObject(themeScale)) {
    return themeScale[val] !== undefined ? themeScale[val] : val;
  }

  return val;
};

const merge = (target, source) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = merge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const handleResponsive = (theme, scale, prop, val) => {
  if (Array.isArray(val)) {
    const styles = {};
    val.forEach((item, index) => {
      const themeVal = getThemeValue(theme, scale, item);
      if (index === 0) {
        styles[prop] = themeVal;
      } else {
        const breakpoint = theme.breakpoints[index - 1];
        if (breakpoint) {
          styles[`@media (min-width: ${breakpoint})`] = {
            [prop]: themeVal
          };
        }
      }
    });
    return styles;
  }

  if (isObject(val)) {
    const styles = {};
    Object.keys(val).forEach((key) => {
      const themeVal = getThemeValue(theme, scale, val[key]);
      if (key === "_") {
        styles[prop] = themeVal;
      } else {
        const breakpoint = theme.breakpoints[key] || key;
        const mediaQuery = breakpoint.includes("em") || breakpoint.includes("px")
          ? `@media (min-width: ${breakpoint})`
          : breakpoint;
        styles[mediaQuery] = {
          [prop]: themeVal
        };
      }
    });
    return styles;
  }

  return { [prop]: getThemeValue(theme, scale, val) };
};

const resolveXAndY = (theme, prop, val) => {
  const scale = scaleMaps[prop] || "space";
  if (prop === "marginX") {
    const left = handleResponsive(theme, scale, "marginLeft", val);
    const right = handleResponsive(theme, scale, "marginRight", val);
    return merge(left, right);
  }
  if (prop === "marginY") {
    const top = handleResponsive(theme, scale, "marginTop", val);
    const bottom = handleResponsive(theme, scale, "marginBottom", val);
    return merge(top, bottom);
  }
  if (prop === "paddingX") {
    const left = handleResponsive(theme, scale, "paddingLeft", val);
    const right = handleResponsive(theme, scale, "paddingRight", val);
    return merge(left, right);
  }
  if (prop === "paddingY") {
    const top = handleResponsive(theme, scale, "paddingTop", val);
    const bottom = handleResponsive(theme, scale, "paddingBottom", val);
    return merge(top, bottom);
  }
  return {};
};

export const parser = (props) => {
  const theme = props.theme && Object.keys(props.theme).length > 0 ? props.theme : defaultTheme;
  let styles = {};

  Object.keys(props).forEach((rawProp) => {
    const prop = aliases[rawProp] || rawProp;
    const val = props[rawProp];

    if (val === undefined || val === null) return;

    if (prop === "marginX" || prop === "marginY" || prop === "paddingX" || prop === "paddingY") {
      styles = merge(styles, resolveXAndY(theme, prop, val));
    } else if (properties[prop]) {
      const scale = scaleMaps[prop];
      styles = merge(styles, handleResponsive(theme, scale, prop, val));
    }
  });

  return styles;
};
