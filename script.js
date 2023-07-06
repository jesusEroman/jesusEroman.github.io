import {
  TableauEventType,
  FilterUpdateType,
  SelectionUpdateType,
} from "https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js";

const vizURL =
  "https://public.tableau.com/views/TableauEmbedding-TTMatchTrackerDraft/TTMatchTrackerDraft?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link&:embed=yes&:toolbar=no";
const datasourceName = "Tableau Embedding - TT Match Tracker Mock";
const viz = document.getElementById("tableauViz");
const vizDiv = document.getElementsByClassName("viz-dashboard-div");
const gamesFilters = document.querySelectorAll('input[type="radio"]');
const getDataBtn = document.getElementsByClassName("get-data-btn")[0];
const searchWinnerBtn = document.getElementsByClassName("search-winner-btn")[0];

document.addEventListener("DOMContentLoaded", function () {
  _initEventListeners();
  _initViz();
});

/*  Methods */
function _initViz() {
  var vizWidth = vizDiv[0].clientWidth;
  var vizHeight = vizDiv[0].clientHeight;

  viz.src = vizURL;
  viz.toolbar = "hidden";
  viz.hideTabs = true;
  viz.hideEditButton = true;
  viz.hideEditInDesktopButton = true;
  viz.suppressDefaultEditBehavior = true;
  viz.height = vizHeight - 10;
  viz.width = vizWidth - 10;
}
function _initEventListeners() {
  viz.addEventListener(
    TableauEventType.MarkSelectionChanged,
    handleMarkSelection
  );
  gamesFilters.forEach((radioBtn) => {
    radioBtn.addEventListener("change", () => {
      filterGame(radioBtn);
    });
  });
  getDataBtn.addEventListener("click", getDatasourceData);
  searchWinnerBtn.addEventListener("click", searchPlayer);
}
/**
 * Creates a list in the html to show the data from the selected dashboard mark
 */
async function handleMarkSelection(event) {
  const marksCollection = await event.detail.getMarksAsync();
  const marksData = marksCollection.data[0];
  const listEl = document.getElementsByClassName("show-data-list")[0];
  listEl.innerHTML = "";
  var dataSelected = createRecords(marksData);
  for (var i = 0; i < dataSelected.length; i++) {
    var record = dataSelected[i];
    var listItem = document.createElement("li");
    Object.keys(record).forEach((key) => {
      listItem.textContent = key + " : " + record[key];
    });
    listEl.appendChild(listItem);
  }
}

/**
 * Combines columns and data into a single record
 */
function createRecords(marksData) {
  var columns = marksData.columns;
  var data = marksData.data[0];
  var output = [];
  for (var i = 0; i < columns.length; i++) {
    var record = {};
    record[columns[i].fieldName] = data[i].value;
    output.push(record);
  }
  console.log("Selected mark data: ", output);
  return output;
}

/**
 * Filters the dashboard based on the selected "Game"
 */
async function filterGame(radioBtn) {
  if (radioBtn.checked) {
    const label = radioBtn.nextElementSibling.textContent.trim();
    console.log("Selected game:", label);
    var sheet = viz.workbook.activeSheet;
    await sheet.applyFilterAsync("Game", [label], FilterUpdateType.Replace);
  }
}

/**
 * Gets data from the viz's datasource and displayes it in a tabulated form
 */
async function getDatasourceData() {
  var worksheet = viz.workbook.activeSheet.worksheets[0];
  const dataSources = await worksheet.getDataSourcesAsync();
  const dataSource = dataSources.find(
    (datasource) => datasource.name === datasourceName
  );
  const logicalTables = await dataSource.getLogicalTablesAsync();
  const dataTable = await dataSource.getLogicalTableDataAsync(
    logicalTables[0].id
  );
  console.log("Data source logical table data: ", dataTable);
  populateVizTable(dataTable.data);
}

/**
 * Displayes the data in a tabulated form
 */
function populateVizTable(data) {
  var table = document.getElementsByClassName("table viz-table")[0];
  var tbody = table.getElementsByTagName("tbody")[0];
  for (var i = 0; i < 100; i++) {
    var row = document.createElement("tr");
    var record = {
      // Creates a "record" from the datasource data
      // Hardcoded for test purposes (e.g. [3] points to match id). Can be edited
      gameId: data[i][3].value,
      game: data[i][1].value,
      date: data[i][0].value,
      winner: data[i][5].value,
    };
    Object.keys(record).forEach((key) => {
      var cell = document.createElement("td");
      cell.textContent = record[key];
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }
}

/**
 * Highlights and selects a mark (e.g. player) from the dashboard
 */
async function searchPlayer() {
  const inputElement = document.getElementById("winnerInput");
  const sheet = viz.workbook.activeSheet.worksheets[3];
  const selection = [
    {
      fieldName: "Match Winner",
      value: inputElement.value.trim(),
    },
  ];
  console.log("Selecting...", inputElement.value, sheet);
  await sheet.selectMarksByValueAsync(selection, SelectionUpdateType.Replace);
}
