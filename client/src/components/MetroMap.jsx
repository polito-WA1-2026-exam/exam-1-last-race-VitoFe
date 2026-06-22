import Icon from "./Icon.jsx";

export default function MetroMap({
  stations = [],
  connections = [],
  lines = [],
  selectedRoute = [], // array of station names
  startStation = null,
  destinationStation = null,
  hideLines = false,
  onStationClick = null,
  activeStepIndex = -1,
  executionSteps = [],
  hideInterchangeIcons = false,
}) {
  const width = 900;
  const height = 500;

  // find a station's coords
  const getCoords = (name) => {
    const s = stations.find((st) => st.name === name);
    return s ? { x: s.x, y: s.y } : { x: 0, y: 0 };
  };

  // find a line's color
  const getLineColor = (lineName) => {
    const l = lines.find((ln) => ln.name === lineName);
    return l ? l.color : "#ccc";
  };

  // station is in the selected route?
  const getRouteIndex = (stationName) => {
    return selectedRoute.indexOf(stationName);
  };

  // text alignment layout based on connections to prevent overlaps
  const getLabelLayout = (stationName) => {
    switch (stationName) {
      case "Fontana Oscura":
        return "left";
      case "Viale dei Mosaici":
      case "Belvedere":
      case "Valle Verde":
        return "right";
      case "Torre Cinerea":
      case "Campo dell'Eco":
      case "Borgo Sereno":
        return "below";
      default:
        return "above";
    }
  };

  return (
    <div
      className="metro-map-container p-3 rounded-4 shadow-sm border mb-4 bg-light overflow-auto"
      style={{
        border: "1px solid var(--border)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          background: "#fafafa",
          borderRadius: "12px",
          minWidth: "800px",
        }}
      >
        {/* 1. Draw Connections, hidden during planning */}
        {!hideLines &&
          connections.map((conn) => {
            const p1 = getCoords(conn.station1);
            const p2 = getCoords(conn.station2);
            const color = getLineColor(conn.line_name);
            return (
              <line
                key={conn.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.85"
              />
            );
          })}

        {/* 2. Draw Player's Route Path (dynamically) */}
        {selectedRoute.length > 1 &&
          selectedRoute.map((st, i) => {
            if (i === 0) return null;
            const p1 = getCoords(selectedRoute[i - 1]);
            const p2 = getCoords(st);
            return (
              <line
                key={`route-line-${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#aa3bff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="8,5"
                className="animate-route-flow"
              />
            );
          })}

        {/* 3. Draw Stations */}
        {stations.map((st) => {
          const isStart = st.name === startStation;
          const isDest = st.name === destinationStation;
          const routeIndex = getRouteIndex(st.name);
          const isSelected = routeIndex !== -1;
          const layout = getLabelLayout(st.name);

          // colors based on status
          let fillColor = "#ffffff";
          let strokeColor = "#333333";
          let strokeWidth = 3;
          let r = 14;

          if (isStart) {
            fillColor = "#2a9d8f";
            strokeColor = "#333333";
            strokeWidth = 3;
          } else if (isDest) {
            fillColor = "#e63946";
            strokeColor = "#333333";
            strokeWidth = 3;
          } else if (isSelected) {
            fillColor = "#aa3bff";
            strokeColor = "#ffffff";
            strokeWidth = 2;
          }

          const isClickable = typeof onStationClick === "function";

          return (
            <g
              key={st.name}
              transform={`translate(${st.x}, ${st.y})`}
              onClick={() => isClickable && onStationClick(st.name)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
            >
              {/* Main station circle */}
              <circle
                r={r}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className="station-circle"
              />

              {/* Inner ring for selected/start/destination to make it stand out */}
              {(isStart || isDest || isSelected) && (
                <circle
                  r={r - 4}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}

              {/* Icon inside circle for interchange stations */}
              {st.is_interchange === 1 &&
                !hideInterchangeIcons &&
                !(isSelected && !isStart && !isDest) && (
                  <foreignObject
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    style={{ overflow: "visible", pointerEvents: "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                      }}
                    >
                      <Icon
                        name="interchange"
                        style={{
                          fontSize: "11px",
                          color:
                            isStart || isDest || isSelected
                              ? "#ffffff"
                              : "#333333",
                        }}
                      />
                    </div>
                  </foreignObject>
                )}

              {/* Centralized Label using foreignObject to avoid text overlapping with lines */}
              {(() => {
                let labelX = -100;
                let labelY = -38;
                let labelWidth = 200;
                let flexDirection = "column";
                let justifyContent = "center";

                if (layout === "below") {
                  labelY = 12;
                } else if (layout === "left") {
                  labelX = -220;
                  labelY = -12;
                  flexDirection = "row";
                  justifyContent = "flex-end";
                } else if (layout === "right") {
                  labelX = 20;
                  labelY = -12;
                  flexDirection = "row";
                  justifyContent = "flex-start";
                }

                const labelColor = isStart
                  ? "#2a9d8f"
                  : isDest
                    ? "#e63946"
                    : isSelected
                      ? "#aa3bff"
                      : "#222222";

                return (
                  <foreignObject
                    x={labelX}
                    y={labelY}
                    width={labelWidth}
                    height="24"
                    style={{ overflow: "visible", pointerEvents: "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: flexDirection,
                        alignItems: "center",
                        justifyContent: justifyContent,
                        width: "100%",
                        height: "100%",
                        fontFamily: "Outfit, sans-serif",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: labelColor,
                          lineHeight: "1",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.name}
                      </span>
                    </div>
                  </foreignObject>
                );
              })()}

              {/* Number indicator if in selected route */}
              {isSelected && !isStart && !isDest && (
                <text
                  y="4"
                  textAnchor="middle"
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontSize: "9px",
                    fontWeight: "bold",
                    fill: "#ffffff",
                  }}
                >
                  {routeIndex + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* 4. Event Midpoint Badges */}
        {(() => {
          if (
            activeStepIndex !== undefined &&
            activeStepIndex >= 0 &&
            executionSteps &&
            executionSteps.length > 0
          ) {
            return executionSteps.map((step, idx) => {
              if (idx > activeStepIndex) return null; // don't show future events yet
              if (selectedRoute.length <= idx + 1) return null;

              const p1 = getCoords(selectedRoute[idx]);
              const p2 = getCoords(selectedRoute[idx + 1]);
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              const effect = step.event.effect;
              let borderColor = "#888888";
              let iconName = "info";
              let textColor = "#666666";
              let bgColor = "#ffffff";
              let textVal = "0";

              if (effect > 0) {
                borderColor = "#2a9d8f";
                iconName = "coin";
                textColor = "#2a9d8f";
                bgColor = "#eefdf6";
                textVal = `+${effect}`;
              } else if (effect < 0) {
                borderColor = "#e63946";
                iconName = "warn";
                textColor = "#e63946";
                bgColor = "#fbebe8";
                textVal = `${effect}`;
              }

              const isCurrent = idx === activeStepIndex;

              return (
                <foreignObject
                  key={`event-badge-${idx}`}
                  x={midX - 35}
                  y={midY - 14}
                  width="70"
                  height="28"
                  style={{ overflow: "visible", pointerEvents: "none" }}
                >
                  <div
                    className={`d-flex align-items-center justify-content-center gap-1 border rounded-pill shadow-sm ${
                      isCurrent ? "animate-pop-in" : ""
                    }`}
                    style={{
                      width: "70px",
                      height: "28px",
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: textColor,
                    }}
                  >
                    <Icon name={iconName} style={{ fontSize: "11px" }} />
                    <span>{textVal}</span>
                  </div>
                </foreignObject>
              );
            });
          }
          return null;
        })()}

        {/* 5. Traversal Person Dot */}
        {(() => {
          if (
            activeStepIndex !== undefined &&
            activeStepIndex >= 0 &&
            activeStepIndex < executionSteps.length &&
            selectedRoute.length > activeStepIndex + 1
          ) {
            const startSt = selectedRoute[activeStepIndex];
            const endSt = selectedRoute[activeStepIndex + 1];
            const p1 = getCoords(startSt);
            const p2 = getCoords(endSt);
            return (
              <g
                key={`traversal-dot-${activeStepIndex}`}
                className="traversal-dot"
                style={{
                  "--start-x": `${p1.x}px`,
                  "--start-y": `${p1.y}px`,
                  "--end-x": `${p2.x}px`,
                  "--end-y": `${p2.y}px`,
                }}
              >
                {/* pulsing ring, because why not */}
                <circle
                  cx="0"
                  cy="0"
                  r="8"
                  fill="#ffc107"
                  opacity="0.6"
                  className="pulsing-ring"
                />
                {/* main dot */}
                <circle
                  cx="0"
                  cy="0"
                  r="7"
                  fill="#ffc107"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  style={{
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.35))",
                  }}
                />
              </g>
            );
          }
          return null;
        })()}
      </svg>
    </div>
  );
}
