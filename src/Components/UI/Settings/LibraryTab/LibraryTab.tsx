import { useContext, useEffect, useState } from "react";
import "./LibraryTab.css";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import SystemContext from "../../../../SystemContext";
import { BarLoader } from "react-spinners";

type LibraryTabTypes = {
  active: boolean;
};

const LibraryTab = ({ active }: LibraryTabTypes) => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  const { systems, setCurrentActiveSystems } = useContext(SystemContext)!;

  if (!systems || systems.length === 0) {
    return (
      <BarLoader
        color="#ffffff"
        loading={true}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    );
  }

  const getInitialActiveSystems = () => {
    const initialActiveSystems = window.localStorage.getItem("activeSystems");
    if (initialActiveSystems) {
      return JSON.parse(initialActiveSystems);
    }
    return [];
  };

  const getInitialDisabledSystems = (activeSystems: System[]) => {
    const activeSystemsNames = activeSystems.map((system) => system.name);
    return systems.filter(
      (system) => !activeSystemsNames.includes(system.name)
    );
  };

  const initialActiveSystems = getInitialActiveSystems();
  const [activeSystems, setActiveSystems] = useState(initialActiveSystems);
  const [disabledSystems, setDisabledSystems] = useState(
    getInitialDisabledSystems(initialActiveSystems)
  );

  useEffect(() => {
    setDisabledSystems(getInitialDisabledSystems(activeSystems));
  }, [activeSystems]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const items =
        source.droppableId === "activeSystems"
          ? (Array.from(activeSystems) as System[])
          : (Array.from(disabledSystems) as System[]);
      const [movedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, movedItem);

      source.droppableId === "activeSystems"
        ? setActiveSystems(items)
        : setDisabledSystems(items);
    } else {
      let sourceItems, setSourceItems, destinationItems, setDestinationItems;

      if (source.droppableId === "activeSystems") {
        sourceItems = Array.from(activeSystems) as System[];
        setSourceItems = setActiveSystems;
        destinationItems = Array.from(disabledSystems) as System[];
        setDestinationItems = setDisabledSystems;
      } else {
        sourceItems = Array.from(disabledSystems) as System[];
        setSourceItems = setDisabledSystems;
        destinationItems = Array.from(activeSystems) as System[];
        setDestinationItems = setActiveSystems;
      }

      const [movedItem] = sourceItems.splice(source.index, 1);
      destinationItems.splice(destination.index, 0, movedItem);

      setSourceItems(sourceItems);
      setDestinationItems(destinationItems);
    }
  };

  function activateAllSystems() {
    setActiveSystems([...activeSystems, ...disabledSystems]);
    setDisabledSystems([]);
  }

  function deactivateAllSystems() {
    setDisabledSystems([...disabledSystems, ...activeSystems]);
    setActiveSystems([]);
  }

  const handleSystemClick = (
    system: System,
    sourceList: System[],
    setSourceList: React.Dispatch<React.SetStateAction<System[]>>,
    targetList: System[],
    setTargetList: React.Dispatch<React.SetStateAction<System[]>>
  ) => {
    setSourceList(sourceList.filter((item) => item.name !== system.name));
    setTargetList([...targetList, system]);
  };

  useEffect(() => {
    window.localStorage.setItem("activeSystems", JSON.stringify(activeSystems));
    setCurrentActiveSystems(activeSystems);
  }, [activeSystems]);

  return (
    <div className={`settings-inner library-tab ${active ? "active" : ""}`}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="consoles">
          <div className="consolesLayout">
            <Droppable droppableId="activeSystems">
              {(provided) => (
                <div className="activeSystems">
                  <h2>Active Systems</h2>
                  <button
                    onClick={deactivateAllSystems}
                    style={
                      activeSystems.length >= 1
                        ? { opacity: 1, transform: "translateX(0)" }
                        : { opacity: 0, transform: "translateX(10px)" }
                    }
                  >
                    &#8649;
                  </button>
                  <div
                    className="activeSystemsInner"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {activeSystems.map((system: System, index: number) => (
                      <Draggable
                        key={system.name}
                        draggableId={system.name}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() =>
                              handleSystemClick(
                                system,
                                activeSystems,
                                setActiveSystems,
                                disabledSystems,
                                setDisabledSystems
                              )
                            }
                          >
                            <img
                              src={`${resourcesPath}/assets/img/webp/logo/${system.name}-logo.webp`}
                              alt={system.title}
                            />
                            <h3>{system.title}</h3>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
            <span></span>
            <Droppable droppableId="disabledSystems">
              {(provided) => (
                <div className="disabledSystems">
                  <h2>Inactive Systems</h2>
                  <button
                    onClick={activateAllSystems}
                    style={
                      disabledSystems.length >= 1
                        ? { opacity: 1, transform: "translateX(0)" }
                        : { opacity: 0, transform: "translateX(10px)" }
                    }
                  >
                    &#8647;
                  </button>
                  <div
                    className="disabledSystemsInner"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {disabledSystems.map((system, index) => (
                      <Draggable
                        key={system.name}
                        draggableId={system.name}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() =>
                              handleSystemClick(
                                system,
                                disabledSystems,
                                setDisabledSystems,
                                activeSystems,
                                setActiveSystems
                              )
                            }
                          >
                            <img
                              src={`${resourcesPath}/assets/img/webp/logo/${system.name}-logo.webp`}
                              alt={system.title}
                            />
                            <h3>{system.title}</h3>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default LibraryTab;
