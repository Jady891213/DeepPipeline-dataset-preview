import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Minimize2, Search, Download, 
  CheckCircle2, ListFilter, Copy,
  Database, PanelRightClose, PanelRightOpen, ChevronDown, ChevronUp,
  Pin, PinOff, Target, FileText
} from 'lucide-react';

// --- Mock Data ---
// Removed 'id' from columns as it's a fixed index now
const initialColumns = [
  { id: 'store', name: 'Store', type: 'STRING' },
  { id: 'product', name: 'Product', type: 'STRING' },
  { id: 'description', name: 'Description', type: 'STRING' },
  { id: 'complex_data', name: 'Complex_Data', type: 'ARRAY<STRUCT>' },
  { id: 'top5_amount', name: 'Top5_Amount', type: 'DOUBLE' },
  { id: 'top5_tax', name: 'Top5_Tax', type: 'DOUBLE' },
  { id: 'store_name', name: 'Store Name', type: 'STRING' },
  { id: 'address', name: 'Address', type: 'STRING' },
  { id: 'tel', name: 'TEL', type: 'STRING' },
  { id: 'employee', name: 'EmployeeName', type: 'STRING' },
  { id: 'test_decimal', name: 'test_decimal', type: 'DECIMAL' },
];

const complexMockData = [
  { "user_id": "123", "YearMonth": "202301", "CustomerCodeList": ["CUST1", "CUST2"] },
  { "user_id": "124", "YearMonth": "202302", "CustomerCodeList": ["CUST3"] }
];

const longTextMock = `这是一个非常长的文案测试。
它包含了换行符以及    多个连续空格。

主要用于测试：
1. 值详情面板是否能正确展开。
2. 展开后是否能保留原始的换行和空格格式。
3. 文本过长时是否能正确滚动和换行显示，而不会撑破容器。

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

const data = [
  { id: 1, store: 'Store A', product: 'Product 3', description: longTextMock, complex_data: JSON.stringify(complexMockData), top5_amount: '1947.429999999999', top5_tax: '186.040000000000', store_name: 'Store A', address: '849 Main St', tel: '(555) 333-4262', employee: 'Manager A', test_decimal: '106493535.585' },
  { id: 2, store: 'Store B', product: 'Product 1', description: '短文案测试', complex_data: JSON.stringify([complexMockData[0]]), top5_amount: '1128.629999999999', top5_tax: '133.5', store_name: 'Store B', address: '535 Main St', tel: '(555) 855-4641', employee: 'Manager B', test_decimal: '106493535.585' },
  { id: 3, store: 'Store A', product: 'Product 1', description: '普通文本', complex_data: "[]", top5_amount: '2007.98', top5_tax: '223.15', store_name: 'Store A', address: '849 Main St', tel: '(555) 333-4262', employee: 'Manager A', test_decimal: '106493535.585' },
  { id: 4, store: 'Store B', product: 'Product 3', description: '带有\n换行的\n短文本', complex_data: JSON.stringify(complexMockData), top5_amount: '1923.68', top5_tax: '118.58', store_name: 'Store B', address: '535 Main St', tel: '(555) 855-4641', employee: 'Manager B', test_decimal: '106493535.585' },
  { id: 5, store: 'Store A', product: 'Product 2', description: '    开头带空格的文本', complex_data: JSON.stringify([complexMockData[1]]), top5_amount: '1833.98', top5_tax: '203.19', store_name: 'Store A', address: '849 Main St', tel: '(555) 333-4262', employee: 'Manager A', test_decimal: '106493535.585' },
  { id: 6, store: 'Store B', product: 'Product 2', description: longTextMock, complex_data: JSON.stringify(complexMockData), top5_amount: '1206.99', top5_tax: '152.39', store_name: 'Store B', address: '535 Main St', tel: '(555) 855-4641', employee: 'Manager B', test_decimal: '106493535.585' },
];

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStruct, setShowStruct] = useState(false);
  const [searchCol, setSearchCol] = useState('');
  const [selectedCell, setSelectedCell] = useState<{row: number, col: string, value: string} | null>(null);
  const [structWidth, setStructWidth] = useState(280);
  const [isValueExpanded, setIsValueExpanded] = useState(false);
  const [showValueDetails, setShowValueDetails] = useState(true);
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());
  
  const structResizerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Filter and sort columns for the structure panel
  const filteredColumns = initialColumns.filter(c => c.name.toLowerCase().includes(searchCol.toLowerCase()));
  const pinnedList = filteredColumns.filter(c => pinnedColumns.has(c.id));
  const unpinnedList = filteredColumns.filter(c => !pinnedColumns.has(c.id));

  // Sort columns for the table: pinned first, then the rest in original order
  const tableColumns = [
    ...initialColumns.filter(c => pinnedColumns.has(c.id)),
    ...initialColumns.filter(c => !pinnedColumns.has(c.id))
  ];

  // Handle column structure resizing (now on the left side of the right drawer)
  useEffect(() => {
    const resizer = structResizerRef.current;
    if (!resizer) return;

    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e: MouseEvent) => {
      // For right drawer, moving left increases width
      const newWidth = startWidth - (e.clientX - startX);
      if (newWidth > 200 && newWidth < 500) {
        setStructWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    const onMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = structWidth;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    };

    resizer.addEventListener('mousedown', onMouseDown);
    return () => resizer.removeEventListener('mousedown', onMouseDown);
  }, [structWidth]);

  // Format complex JSON for display
  const formatValue = (val: string) => {
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const scrollToColumn = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tableContainerRef.current) return;
    
    // Find the header cell with this text
    const headers = tableContainerRef.current.querySelectorAll('th');
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].textContent === colName) {
        // Scroll the container to show this column
        const container = tableContainerRef.current;
        const th = headers[i];
        
        // Calculate position to center the column
        const scrollLeft = th.offsetLeft - (container.clientWidth / 2) + (th.clientWidth / 2);
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
        
        // Add a brief highlight effect
        th.classList.add('bg-blue-100', 'transition-colors', 'duration-500');
        setTimeout(() => {
          th.classList.remove('bg-blue-100');
        }, 1000);
        break;
      }
    }
  };

  // Render a column item in the structure list
  const renderColumnItem = (col: typeof initialColumns[0], isPinned: boolean) => (
    <div 
      key={col.id} 
      className="py-2 px-2 hover:bg-white hover:shadow-sm cursor-pointer rounded-md group transition-all flex items-center justify-between border border-transparent hover:border-gray-200 relative"
      onClick={(e) => scrollToColumn(col.name, e)}
    >
      <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate pr-2 flex-1" title={col.name}>
        {col.name}
      </div>
      
      {/* Default view: Type */}
      <div className="text-[11px] text-gray-400 font-mono shrink-0 bg-gray-100 px-1.5 py-0.5 rounded group-hover:opacity-0 transition-opacity">
        {col.type}
      </div>
      
      {/* Hover view: Actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
        <button 
          onClick={(e) => scrollToColumn(col.name, e)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="定位到该列"
        >
          <Target className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => togglePin(col.id, e)}
          className={`p-1 rounded transition-colors ${isPinned ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          title={isPinned ? "取消置顶" : "置顶该列"}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      
      {/* --- Main Canvas Area (Simulated) --- */}
      <div className="w-full max-w-[1400px] h-[800px] bg-white border border-gray-300 rounded-xl shadow-lg relative overflow-hidden flex flex-col">
        
        {/* Canvas Background */}
        <div className="flex-1 bg-[#f8f9fa] p-8 flex items-center justify-center">
          <div className="text-gray-400 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">数据流画布区域</p>
            <p className="text-sm mt-2">点击左上角预览框的放大/缩小按钮体验交互</p>
          </div>
        </div>

        {/* --- Preview Panel --- */}
        <div 
          className={`absolute top-4 left-4 bg-white border border-gray-300 flex flex-col transition-all duration-300 ease-in-out shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-10 rounded-xl overflow-hidden
            ${isExpanded 
              ? 'w-[90%] h-[80%]' 
              : 'w-[700px] h-[360px]'
            }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-emerald-50 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" /> 调试
              </div>
              <div className="flex gap-6 text-sm font-medium">
                <div className="text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer">结果</div>
                <div className="text-gray-500 hover:text-gray-800 cursor-pointer pb-1">日志</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="hidden sm:inline">运行时长: 452.77ms</span>
              <div className="h-4 w-px bg-gray-300"></div>
              <button className="hover:text-gray-800 transition-colors" title="过滤">
                <ListFilter className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-50 text-gray-600 p-1.5 rounded-md"
                title={isExpanded ? "收起" : "展开"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Data Area (Now on the left) */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              
              {/* Table Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-800">&lt;Dataset(6, 10)&gt;</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">预览行数</span>
                    <select className="border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-blue-500">
                      <option>100</option>
                      <option>500</option>
                    </select>
                  </div>
                  <div className="h-4 w-px bg-gray-200"></div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors" title="下载">
                    <Download className="w-4 h-4" />
                  </button>
                  {/* Toggle Value Details Button */}
                  <button 
                    onClick={() => setShowValueDetails(!showValueDetails)}
                    className={`p-1.5 rounded-md transition-colors border ${showValueDetails ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'}`}
                    title={showValueDetails ? "收起值详情" : "展开值详情"}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {/* Toggle Column Structure Button (Moved next to download) */}
                  <button 
                    onClick={() => setShowStruct(!showStruct)}
                    className={`p-1.5 rounded-md transition-colors border ${showStruct ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'}`}
                    title={showStruct ? "收起列结构" : "展开列结构"}
                  >
                    {showStruct ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Value Details Bar (Toggleable) */}
              {showValueDetails && (
                <div className="flex items-start gap-3 px-4 py-2 border-b border-gray-200 bg-[#f8f9fa] shrink-0 transition-all duration-300 z-20 relative shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500 font-mono text-xs w-28 shrink-0 py-1.5">
                    <div className="px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-medium text-[10px] border border-gray-300 truncate" title={selectedCell ? `${selectedCell.col} : ${selectedCell.row}` : 'INDEX'}>
                      {selectedCell ? `${selectedCell.col} : ${selectedCell.row}` : 'INDEX'}
                    </div>
                  </div>
                  
                  <div className={`flex-1 font-mono text-sm text-gray-800 bg-white border border-gray-300 rounded-md flex flex-col group shadow-inner transition-all duration-200 ${isValueExpanded ? 'absolute left-36 right-4 top-2 z-30 shadow-xl' : 'relative'}`}>
                    <div className="flex items-start justify-between p-1.5">
                      <div className={`flex-1 overflow-hidden ${isValueExpanded ? 'max-h-[300px] overflow-y-auto custom-scrollbar p-2' : 'max-h-6'}`}>
                        {selectedCell ? (
                          <pre className="m-0 font-mono text-sm whitespace-pre-wrap break-all">
                            {isValueExpanded ? formatValue(selectedCell.value) : selectedCell.value}
                          </pre>
                        ) : (
                          <span className="text-gray-400 italic">点击下方表格单元格查看完整内容...</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 ml-2 bg-white pl-2">
                        {selectedCell && (
                          <button 
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                            title="复制内容"
                            onClick={() => navigator.clipboard.writeText(formatValue(selectedCell.value))}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          className={`text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100 ${!selectedCell ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isValueExpanded ? "收起" : "展开完整内容"}
                          onClick={() => selectedCell && setIsValueExpanded(!isValueExpanded)}
                          disabled={!selectedCell}
                        >
                          {isValueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay when value is expanded to close it by clicking outside */}
              {isValueExpanded && showValueDetails && (
                <div 
                  className="absolute inset-0 z-20 bg-transparent" 
                  onClick={() => setIsValueExpanded(false)}
                />
              )}

              {/* Data Table */}
              <div 
                ref={tableContainerRef}
                className="flex-1 overflow-auto custom-scrollbar relative z-0 scroll-smooth"
              >
                <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                  <thead className="text-xs text-gray-600 bg-[#f8f9fa] sticky top-0 z-10 shadow-[0_1px_0_rgba(229,231,235,1)]">
                    <tr>
                      {/* Fixed Index Column Header */}
                      <th className="px-4 py-2.5 font-medium border-r border-gray-200 bg-gray-100 sticky left-0 z-20 w-12 text-center text-gray-400 shadow-[1px_0_0_rgba(229,231,235,1)]">
                        #
                      </th>
                      {/* Dynamic Columns */}
                      {tableColumns.map(col => {
                        const isPinned = pinnedColumns.has(col.id);
                        return (
                          <th 
                            key={col.id} 
                            className={`px-4 py-2.5 font-medium border-r border-gray-200 last:border-r-0 transition-colors
                              ${isPinned ? 'bg-amber-50/80 text-amber-800' : ''}`}
                          >
                            <div className="flex items-center gap-1">
                              {isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                              {col.name}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rowIndex) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        {/* Fixed Index Column Cell */}
                        <td className="px-4 py-2 border-r border-gray-100 bg-gray-50 sticky left-0 z-10 w-12 text-center text-gray-400 font-mono text-xs shadow-[1px_0_0_rgba(229,231,235,1)]">
                          {rowIndex + 1}
                        </td>
                        {/* Dynamic Column Cells */}
                        {tableColumns.map(col => {
                          const isSelected = selectedCell?.row === rowIndex + 1 && selectedCell?.col === col.name;
                          const isPinned = pinnedColumns.has(col.id);
                          const cellValue = String(row[col.id as keyof typeof row]);
                          return (
                            <td 
                              key={col.id} 
                              onClick={() => {
                                setSelectedCell({ row: rowIndex + 1, col: col.name, value: cellValue });
                                if (isValueExpanded) setIsValueExpanded(false);
                              }}
                              className={`px-4 py-2 border-r border-gray-100 last:border-r-0 cursor-pointer transition-colors
                                ${isSelected ? 'bg-blue-50 outline outline-1 outline-blue-400 -outline-offset-1 z-0 relative' : ''}
                                ${isPinned && !isSelected ? 'bg-amber-50/30' : ''}`}
                            >
                              <div className="truncate max-w-[180px] text-gray-700 font-mono text-[13px]">
                                {col.type.includes('ARRAY') || col.type.includes('STRUCT') ? (
                                  <span className="text-blue-600">{cellValue}</span>
                                ) : (
                                  cellValue
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column Structure Drawer (Now on the right) */}
            {showStruct && (
              <div 
                className="border-l border-gray-200 flex flex-col bg-[#fafafa] shrink-0 relative shadow-[-5px_0_15px_rgba(0,0,0,0.03)] z-10"
                style={{ width: structWidth }}
              >
                {/* Resizer Handle (Now on the left side of the drawer) */}
                <div 
                  ref={structResizerRef}
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10"
                />

                <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-white">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="搜索列..." 
                      value={searchCol}
                      onChange={(e) => setSearchCol(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-gray-50 focus:bg-white" 
                    />
                  </div>
                </div>
                
                {/* Column List Header */}
                <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 bg-gray-50">
                  <span>列名</span>
                  <span>类型</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {/* Pinned Columns Section */}
                  {pinnedList.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> 已置顶
                      </div>
                      <div className="space-y-0.5">
                        {pinnedList.map(col => renderColumnItem(col, true))}
                      </div>
                      <div className="h-px bg-gray-200 my-3 mx-2"></div>
                    </div>
                  )}

                  {/* Unpinned Columns Section */}
                  <div className="space-y-0.5">
                    {pinnedList.length > 0 && (
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
                        全部列
                      </div>
                    )}
                    {unpinnedList.map(col => renderColumnItem(col, false))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Add some custom scrollbar styling globally for this demo */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}} />
    </div>
  );
}
