/*! InstantDataScraperNext - 2025-01-29 */

// Helper function to format working time in hh:mm:ss format
function formatWorkingTime(seconds) {
    const totalSeconds = seconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function e(e, t, n, o, r, a, i) {
    var s = {}
      , c = null
      , l = !1
      , d = !1
      , f = {
        urls: ["<all_urls>"],
        tabId: n,
        types: ["main_frame", "sub_frame", "stylesheet", "script", "font", "object", "xmlhttprequest", "other"]
    };
    function u() {
        !l && d && (i || function(e) {
            e(!0)
        }
        )(function(e) {
            if (!e)
                return g();
            l || (l = !0,
            chrome.webRequest.onBeforeRequest.removeListener(p),
            chrome.webRequest.onCompleted.removeListener(h),
            chrome.webRequest.onErrorOccurred.removeListener(h),
            t())
        })
    }
    function p(e) {
        s[e.requestId] = 1,
        c = new Date
    }
    function h(e) {
        c && (delete s[e.requestId],
        Object.keys(s).length || g())
    }
    function g() {
        setTimeout(function() {
            new Date - c < r || Object.keys(s).length || u()
        }, r)
    }
    chrome.webRequest.onBeforeRequest.addListener(p, f),
    chrome.webRequest.onCompleted.addListener(h, f),
    chrome.webRequest.onErrorOccurred.addListener(h, f),
    (e || function(e) {
        e()
    }
    )(function() {
        setTimeout(u, o),
        setTimeout(function() {
            d = !0,
            g()
        }, a)
    })
}
function t(e, t) {
    return t && (e += 1462),
    (Date.parse(e) - new Date(Date.UTC(1899, 11, 30))) / 864e5
}
function n(e, n) {
    for (var o = {}, r = {
        s: {
            c: 1e7,
            r: 1e7
        },
        e: {
            c: 0,
            r: 0
        }
    }, a = 0; a != e.length; ++a)
        for (var i = 0; i != e[a].length; ++i) {
            r.s.r > a && (r.s.r = a),
            r.s.c > i && (r.s.c = i),
            r.e.r < a && (r.e.r = a),
            r.e.c < i && (r.e.c = i);
            var s = {
                v: e[a][i]
            };
            if (null !== s.v) {
                var c = XLSX.utils.encode_cell({
                    c: i,
                    r: a
                });
                "number" == typeof s.v ? s.t = "n" : "boolean" == typeof s.v ? s.t = "b" : s.v instanceof Date ? (s.t = "n",
                s.z = XLSX.SSF._table[14],
                s.v = t(s.v)) : s.t = "s",
                o[c] = s
            }
        }
    return r.s.c < 1e7 && (o["!ref"] = XLSX.utils.encode_range(r)),
    o
}
function o(e, t) {
    e.data.unshift(e.fields);
    var o = new function e() {
        if (!(this instanceof e))
            return new e;
        this.SheetNames = [],
        this.Sheets = {}
    }
      , r = n(e.data);
    return o.SheetNames.push(t),
    o.Sheets[t] = r,
    XLSX.write(o, {
        type: "binary"
    })
}
function r(e) {
    try {
        e()
    } catch (e) {
        console.log("Error: ", e)
    }
}
// Analytics disabled: provide no-op implementation
const a = {
    fireEvent: () => {},
    firePageViewEvent: () => {}
};
var i = {
    id: parseInt(u("tabid")),
    url: u("url")
}
  , s = {}
  , c = 1e3
  , l = null;
async function d() {
    null !== i.url.toLowerCase().match(/\/\/[a-z]+\.linkedin\.com/) ? ($("#waitHeader").hide(),
    p("We're unable to collect data from LinkedIn. Sorry for the inconvenience.  If you have further questons please contact us at info@webrobots.io", "noResponseErr", !1, !0)) : (I(),
    setTimeout(function() {
        console.log("no response"),
        $("#waitHeader").is(":visible") && y(!0)
    }, 5e4),
    $(window).resize(function() {
        v()
    }),
    R())
}
function f(e, t) {
    return (t || ".") + e.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&")
}
function u(e) {
    for (var t = window.location.search.substring(1).split("&"), n = 0; n < t.length; n++) {
        var o = t[n].split("=");
        if (decodeURIComponent(o[0]) == e)
            return decodeURIComponent(o[1])
    }
}
function p(e, t, n, o) {
    if ("" === e)
        return $("#" + t).hide();
    $("#" + t).show().text(e),
    n && L(e),
    o && a.fireEvent("Error", {
        url: s.startingUrl || i.url,
        msg: e
    })
}
function h(e) {
    var t = e.length
      , n = {
        "": 1 / 0
    }
      , o = {}
      , r = {}
      , a = {}
      , i = {};
    function c(e) {
        return e in n ? n[e] : (n[e] = $(f(e)).length,
        n[e])
    }
    e.forEach(function(e) {
        for (var t in e)
            t in o || (o[t] = 0),
            o[t]++
    }),
    Object.keys(o).map(function(e) {
        return [o[e], e]
    }).forEach(function([n,o]) {
        var s = ""
          , l = 1 / 0;
        o.split(" ")[0].split("/").slice(1).reverse().forEach(function(e) {
            e.split(".").slice(1).forEach(function(e) {
                l < 2 * t || c(e) >= l || (s = e,
                l = c(e))
            })
        });
        var d = o.split(" ")[1]
          , f = 0
          , u = e.map(function(e) {
            return o in e
        });
        d && isNaN(d) && (s += " " + d),
        s in r ? (r[s].forEach(function(e, t) {
            if (!f) {
                var n = !0;
                e.forEach(function(e, t) {
                    n &= !(u[t] && e)
                }),
                n && (f = t + 1)
            }
        }),
        f ? r[s][f - 1] = r[s][f - 1].map(function(e, t) {
            return u[t] || e
        }) : (r[s].push(u),
        f = r[s].length),
        f > 1 && (s += " " + f)) : r[s] = [u],
        s in a || (a[s] = []),
        a[s].push(o),
        s in i || (i[s] = 0),
        i[s] += n
    });
    var l = {}
      , d = {
        fields: r = Object.keys(a).filter(function(n) {
            var o = {}
              , r = [];
            return !(n in s.config.deletedFields) && (e.map(function(e) {
                for (var t, i = 0; i < a[n].length; i++)
                    a[n][i]in e && ((t = e[a[n][i]])in o || (o[t] = 0),
                    o[t]++);
                r.push(t)
            }),
            Object.keys(o).length && o[Object.keys(o)[0]] == t ? (0,
            !1) : (r = JSON.stringify(r))in l ? (0,
            !1) : (l[r] = 1,
            !(i[n] < .2 * t) || (0,
            !1)))
        }),
        data: e.map(function(e) {
            return r.map(function(t) {
                for (var n = 0; n < a[t].length; n++)
                    if (a[t][n]in e)
                        return e[a[t][n]];
                return ""
            })
        })
    };
    return s.names = r,
    s.namePaths = a,
    d
}
function g(e) {
    return e.map(function(e) {
        return e in s.config.headers ? s.config.headers[e] : e
    })
}
function w(e) {
    var t = h(e);
    return t.fields = g(t.fields),
    t
}
function m(e) {
    for (var t = new ArrayBuffer(e.length), n = new Uint8Array(t), o = 0; o != e.length; ++o)
        n[o] = 255 & e.charCodeAt(o);
    return t
}
function b() {
    a.fireEvent("Download", {
        hostName: s.hostName,
        startingUrl: s.startingUrl,
        dataLength: s.data.length
    }),
    ( () => {
        let e = e => {
            let t = {};
            for (let n = 0; n < 4; n++)
                void 0 !== e[n] ? t[`selector${n}`] = e[n] : t[`selector${n}`] = "";
            return t
        }
          , t = Object.keys(s.config.headers).length;
        t && j(!0).then(n => {
            let[o,r] = n;
            const i = e => r.find(t => t.field_id === e);
            let c = {
                tableId: s.tableId,
                hostName: s.hostName,
                startingUrl: s.startingUrl
            };
            if (t)
                for (name in s.config.headers) {
                    let t = i(s.config.headers[name]).selector.split(",").map(e => e.slice(-100))
                      , n = Object.assign(e(t), c, {
                        originalName: name,
                        newName: s.config.headers[name]
                    });
                    a.fireEvent("RenameColumn", n)
                }
        }
        )
    }
    )()
}
function v() {
    var e = h(s.data);
    e.data = e.data.slice(0, c),
    s.previewLength = e.data.length;
    
    // Set pagination to last page when new data is loaded (show most recent data)
    const recordsPerPage = 10;
    const totalRecords = e.data.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    window.currentPage = totalPages > 0 ? totalPages : 1;
    
    // Check if modern UI is being used (index.html)
    const isModernUI = $('body').hasClass('bg-gray-100') || $('#hot').hasClass('overflow-x-auto');
    
    if (isModernUI) {
        // Generate modern HTML table for the new interface
        generateModernTable(e);
    } else {
        // Use original Handsontable for popup.html
        generateHandsontable(e);
    }
}

function generateModernTable(e) {
    const headers = g(e.fields);
    const data = e.data;
    
    // Handle empty state
    if (!data || data.length === 0) {
        $("#hot").html(`
            <div class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="fas fa-table text-4xl mb-4"></i>
                <h3 class="text-lg font-medium mb-2">No Data Available</h3>
                <p class="text-sm">Start scraping to see data appear here</p>
            </div>
        `);
        return;
    }
    
    // Pagination settings
    const recordsPerPage = 10;
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    
    // Get current page from global state or default to 1
    if (!window.currentPage) window.currentPage = 1;
    if (window.currentPage > totalPages) window.currentPage = totalPages;
    if (window.currentPage < 1) window.currentPage = 1;
    
    // Calculate start and end indices for current page
    const startIndex = (window.currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
    const currentPageData = data.slice(startIndex, endIndex);
    
    let tableHtml = `
        <div class="table-container">
            <table class="w-full resizable-table">
                <thead class="bg-gray-50">
                    <tr>`;
    
    // Generate headers
    headers.forEach((header, index) => {
        const fieldName = e.fields[index] || `field_${index}`;
        tableHtml += `
                        <th class="px-3 py-2 text-left text-sm font-medium text-gray-700 relative group resizable-column" style="min-width: 400px; width: 400px;">
                            <div class="flex items-center justify-between pr-2">
                                <span class="header-text">${escapeHtml(header)}</span>
                                <div class="opacity-70 group-hover:opacity-100 transition-opacity duration-200 flex items-center z-20 relative">
                                    <button class="edit-header-btn ml-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-all border border-transparent hover:border-blue-200" data-field="${escapeHtml(fieldName)}" title="Edit header">
                                        <i class="fas fa-edit text-sm"></i>
                                    </button>
                                    <button class="remove-column-btn ml-1 text-gray-600 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all border border-transparent hover:border-red-200" data-field="${escapeHtml(fieldName)}" title="Remove column">
                                        <i class="fas fa-trash text-sm"></i>
                                    </button>
                                    <div class="column-menu-btn relative ml-1">
                                        <button class="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1 rounded transition-all" title="Column options">
                                            <i class="fas fa-ellipsis-v text-xs"></i>
                                        </button>
                                        <div class="column-menu absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-40 hidden">
                                            <button class="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 move-column-left" data-field="${escapeHtml(fieldName)}">
                                                <i class="fas fa-arrow-left mr-2"></i>Move Left
                                            </button>
                                            <button class="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 move-column-right" data-field="${escapeHtml(fieldName)}">
                                                <i class="fas fa-arrow-right mr-2"></i>Move Right
                                            </button>
                                            <hr class="my-1">
                                            <button class="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 duplicate-column" data-field="${escapeHtml(fieldName)}">
                                                <i class="fas fa-copy mr-2"></i>Duplicate Column
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="column-resizer absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors z-10" title="Drag to resize column"></div>
                        </th>`;
    });
    
    tableHtml += `
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">`;
    
    // Generate data rows for current page
    currentPageData.forEach((row, rowIndex) => {
        tableHtml += `<tr class="hover:bg-gray-50">`;
        row.forEach((cell, cellIndex) => {
            // Smart styling based on content
            let cellClass = "px-3 py-2 text-sm";
            const cellText = String(cell || '');
            
            // Check if it's a price
            if (cellText.match(/^\$[\d,]+\.?\d*$/)) {
                cellClass += " text-blue-600 font-medium";
            }
            // Check if it's a rating
            else if (cellText.match(/^\d+(\.\d+)?\/\d+$/)) {
                cellClass += " text-gray-900";
            }
            // Check if it's availability status
            else if (cellText.toLowerCase().includes('stock') || cellText.toLowerCase().includes('available')) {
                if (cellText.toLowerCase().includes('out') || cellText.toLowerCase().includes('unavailable')) {
                    cellClass += " text-red-600 font-medium";
                } else {
                    cellClass += " text-green-600 font-medium";
                }
            }
            // Check if it's a URL
            else if (cellText.match(/^https?:\/\//)) {
                cellClass += " text-blue-600 hover:text-blue-800 cursor-pointer underline";
            }
            // Check if it's a link or clickable content based on header
            else if (headers[cellIndex] && (headers[cellIndex].toLowerCase().includes('name') || headers[cellIndex].toLowerCase().includes('title'))) {
                cellClass += " text-blue-600 hover:text-blue-800 cursor-pointer";
            }
            // Default styling
            else {
                cellClass += " text-gray-900";
            }
            
            // Handle long text truncation
            let displayText = escapeHtml(cellText);
            if (displayText.length > 100) {
                displayText = displayText.substring(0, 97) + '...';
                cellClass += " relative";
            }
            
            tableHtml += `<td class="${cellClass}" title="${escapeHtml(cellText)}">${displayText}</td>`;
        });
        tableHtml += `</tr>`;
    });
    
    tableHtml += `
                </tbody>
            </table>`;
    
    // Add pagination controls
    if (totalPages > 1) {
        tableHtml += `
            <div class="pagination-controls bg-gray-50 border-t px-4 py-3 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-700">
                        Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} records (Page ${window.currentPage} of ${totalPages})
                    </span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="pagination-btn px-3 py-1 text-sm border rounded ${window.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                            ${window.currentPage === 1 ? 'disabled' : ''} 
                            data-page="1" title="First page" ${window.currentPage === 1 ? 'style="pointer-events: none;"' : ''}>
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="pagination-btn px-3 py-1 text-sm border rounded ${window.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                            ${window.currentPage === 1 ? 'disabled' : ''} 
                            data-page="${window.currentPage - 1}" title="Previous page" ${window.currentPage === 1 ? 'style="pointer-events: none;"' : ''}>
                        <i class="fas fa-angle-left"></i>
                    </button>
                    
                    <div class="flex items-center space-x-1">
                        ${generatePageNumbers(window.currentPage, totalPages)}
                    </div>
                    
                    <button class="pagination-btn px-3 py-1 text-sm border rounded ${window.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                            ${window.currentPage === totalPages ? 'disabled' : ''} 
                            data-page="${window.currentPage + 1}" title="Next page" ${window.currentPage === totalPages ? 'style="pointer-events: none;"' : ''}>
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="pagination-btn px-3 py-1 text-sm border rounded ${window.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                            ${window.currentPage === totalPages ? 'disabled' : ''} 
                            data-page="${totalPages}" title="Last page" ${window.currentPage === totalPages ? 'style="pointer-events: none;"' : ''}>
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>`;
    }
    
    // Add footer with statistics
    const totalRows = s.data ? s.data.length : 0;
    const previewRows = data.length;
    
    if (previewRows < totalRows) {
        tableHtml += `
        <div class="p-4 border-t bg-gray-50">
            <p class="text-sm text-gray-600 text-center">Showing first ${previewRows} rows of ${totalRows} total rows</p>
        </div>`;
    }
    
    tableHtml += `</div>`;
    
    $("#hot").html(tableHtml);
    
    // Add direct event handlers for pagination (fallback method)
    $("#hot").off('click', '.pagination-btn').on('click', '.pagination-btn', function(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log('Direct pagination button clicked!', $(this).data('page'));
        const newPage = $(this).data('page');
        if (newPage && !$(this).prop('disabled')) {
            console.log('Direct change to page:', newPage);
            changePage(newPage);
        }
    });
    
    // Add event listeners for modern table interactions
    addModernTableEventListeners();
    
    // Apply smart column widths after table is rendered
    setTimeout(() => {
        applySmartColumnWidths();
        
        // Debug: Check if buttons are rendered
        console.log('Column header buttons found:', $('.edit-header-btn').length, $('.remove-column-btn').length);
        
        // Force visibility for debugging
        $('.edit-header-btn, .remove-column-btn').css({
            'display': 'inline-flex',
            'visibility': 'visible'
        });
    }, 100);
}

// Function to generate page number buttons
function generatePageNumbers(currentPage, totalPages) {
    let pageNumbers = '';
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers += `
                <button class="pagination-btn px-3 py-1 text-sm border rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                        data-page="${i}">
                    ${i}
                </button>`;
        }
    } else {
        // Show limited pages with ellipsis
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            pageNumbers += `
                <button class="pagination-btn px-3 py-1 text-sm border rounded bg-white text-gray-700 hover:bg-gray-50" 
                        data-page="1">
                    1
                </button>`;
            if (startPage > 2) {
                pageNumbers += `<span class="px-2 text-gray-500">...</span>`;
            }
        }
        
        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers += `
                <button class="pagination-btn px-3 py-1 text-sm border rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                        data-page="${i}">
                    ${i}
                </button>`;
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers += `<span class="px-2 text-gray-500">...</span>`;
            }
            pageNumbers += `
                <button class="pagination-btn px-3 py-1 text-sm border rounded bg-white text-gray-700 hover:bg-gray-50" 
                        data-page="${totalPages}">
                    ${totalPages}
                </button>`;
        }
    }
    
    return pageNumbers;
}

// Global function to change page
window.changePage = function(newPage) {
    console.log('changePage called with:', newPage);
    console.log('Current page before change:', window.currentPage);
    
    // Add loading state
    const tableContainer = $('.table-container');
    if (tableContainer.length) {
        tableContainer.addClass('loading');
    }
    
    // Update current page
    window.currentPage = newPage;
    console.log('Current page after change:', window.currentPage);
    
    // Regenerate the table with new page after a short delay for smooth transition
    setTimeout(() => {
        console.log('Regenerating table for page:', window.currentPage);
        const e = h(s.data);
        generateModernTable(e);
        
        // Remove loading state
        if (tableContainer.length) {
            tableContainer.removeClass('loading');
        }
        
        // Scroll to top of table if needed
        const hotElement = $('#hot');
        if (hotElement.length) {
            hotElement[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        console.log('Page change completed successfully');
    }, 150);
};

// Function to apply smart column widths based on content
function applySmartColumnWidths() {
    const table = $("#hot table");
    if (table.length === 0) return;
    
    const headers = table.find('th');
    const firstRow = table.find('tbody tr:first-child td');
    
    headers.each(function(index) {
        const header = $(this);
        const headerText = header.find('.header-text').text();
        const cellData = firstRow.eq(index);
        
        if (cellData.length === 0) return;
        
        // Create temporary elements to measure content width
        const tempHeader = $('<span>').text(headerText).css({
            'font-size': '14px',
            'font-weight': '500',
            'visibility': 'hidden',
            'position': 'absolute',
            'white-space': 'nowrap'
        });
        
        const tempCell = $('<span>').text(cellData.text()).css({
            'font-size': '14px',
            'visibility': 'hidden',
            'position': 'absolute',
            'white-space': 'nowrap'
        });
        
        $('body').append(tempHeader).append(tempCell);
        
        // Get the maximum width needed
        const headerWidth = tempHeader.outerWidth() + 100; // Add padding for buttons
        const cellWidth = tempCell.outerWidth() + 24; // Add padding
        const contentWidth = Math.max(headerWidth, cellWidth);
        
        // Clean up temporary elements
        tempHeader.remove();
        tempCell.remove();
        
        // Apply smart width: use content width if less than 400px, otherwise use 400px minimum
        const finalWidth = Math.max(contentWidth, 200); // Absolute minimum of 200px
        const optimalWidth = finalWidth < 400 ? finalWidth : 400;
        
        header.css('width', optimalWidth + 'px');
        
        // Update corresponding cells in the same column
        const columnIndex = header.index();
        table.find('tbody tr').each(function() {
            $(this).find('td').eq(columnIndex).css('width', optimalWidth + 'px');
        });
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateHandsontable(e) {
    var t = $(".wtHolder").scrollTop()
      , n = $(".wtHolder").scrollLeft()
      , o = !1;
    $("#hot").empty();
    new Handsontable($("#hot").get(0),{
        data: e.data,
        colHeaders: g(e.fields),
        wordWrap: !0,
        autoColumnSize: { useHeaders: true },
        autoRowSize: true,
        manualColumnResize: !0,
        width: $(window).width() - 20,
        height: $(window).height() - $("#hot").get(0).getBoundingClientRect().y,
        afterRender: function() {
            o || (o = !0,
            $(".wtHolder").scrollTop(t),
            $(".wtHolder").scrollLeft(n))
        },
        modifyColWidth: function(width, col) {
            if (width > 500) return 500;
            return width; // let smaller columns fit content
        },
        afterGetColHeader: function(t, n) {
            if (-1 != t) {
                $(n).children().length > 1 ? $(".hot-header", n).remove() : $(n).on('click.headerFocus', function(ev) {
                    // avoid blocking resize: ignore clicks near resizer area (right edge ~8px)
                    const rect = n.getBoundingClientRect();
                    if (ev.clientX > rect.right - 8) return; 
                    var e = this;
                    setTimeout(function() {
                        $(".header-input", e).trigger("focus")
                    }, 20)
                });
                var o = $("<div>", {
                    class: "hot-header"
                })
                  , r = $("<div>", {
                    class: "header-input",
                    contenteditable: "true"
                });
                s.config.headers[e.fields[t]] ? r.text(s.config.headers[e.fields[t]]) : r.text(n.firstChild.textContent),
                $(n).append(o),
                o.append(r),
                o.append($("<span>", {
                    class: "glyphicon glyphicon-remove remove-column",
                    style: "padding-top: 2.5px"
                }).click(function() {
                    s.config.deletedFields[e.fields[t]] = !0,
                    S(),
                    $("#resetColumns").show(),
                    v()
                })),
                r.get(0).addEventListener("input", function(n) {
                    s.config.headers[e.fields[t]] = r.text(),
                    S()
                }),
                n.firstChild.style.display = "none"
            }
        },
        beforeOnCellMouseDown: function(evt, coords, elem) {
            // Do not stop propagation on header cells so the resize plugin can capture the drag
            if (coords.row < 0) {
                // Allow the column resizer and header interactions to work
                return;
            }
        }
    })
}

function addModernTableEventListeners() {
    // Handle header editing
    $(document).off('click', '.edit-header-btn').on('click', '.edit-header-btn', function(e) {
        e.stopPropagation();
        e.preventDefault();
        const field = $(this).data('field');
        const headerText = $(this).closest('th').find('.header-text');
        const currentText = headerText.text();
        
        // Create inline editor
        const input = $(`<input type="text" class="header-edit-input" value="${currentText}">`);
        headerText.hide();
        headerText.parent().prepend(input);
        input.focus().select();
        
        // Handle save
        const saveEdit = () => {
            const newText = input.val().trim();
            if (newText && newText !== currentText) {
                s.config.headers[field] = newText;
                S();
                headerText.text(newText);
                
                // Update stats display if needed
                q();
            }
            input.remove();
            headerText.show();
        };
        
        input.on('blur', saveEdit);
        input.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                saveEdit();
            } else if (e.which === 27) { // Escape key
                input.remove();
                headerText.show();
            }
        });
    });
    
    // Handle column removal
    $(document).off('click', '.remove-column-btn').on('click', '.remove-column-btn', function(e) {
        e.stopPropagation();
        e.preventDefault();
        const field = $(this).data('field');
        const columnHeader = $(this).closest('th').find('.header-text').text();
        
        // Enhanced confirmation with column name
        const confirmMessage = `Are you sure you want to remove the "${columnHeader}" column?\n\nThis action will hide the column from your data view. You can restore it later using the "Reset Columns" button.`;
        
        if (confirm(confirmMessage)) {
            // Visual feedback before removal
            const column = $(this).closest('th');
            column.addClass('animate-pulse bg-red-100');
            
    setTimeout(() => {
                s.config.deletedFields[field] = true;
                S();
                $("#resetColumns").show();
                v(); // Regenerate table
                
                // Update stats
                q();
                
                // Show success message
                showColumnRemovalNotification(columnHeader);
            }, 300);
        }
    });
    
    // Handle URL clicks
    $(document).off('click', '.table-cell-link').on('click', '.table-cell-link', function(e) {
        const url = $(this).text().trim();
        if (url.match(/^https?:\/\//)) {
            e.preventDefault();
            chrome.tabs.create({ url: url });
        }
    });
    
    // Add loading state management
    window.setTableLoading = function(loading) {
        const tableContainer = $("#hot");
        if (loading) {
            tableContainer.addClass('table-loading');
        } else {
            tableContainer.removeClass('table-loading');
        }
    };
    
    // Add column resizing functionality
    addColumnResizing();
    
    // Add column menu functionality
    addColumnMenuHandlers();

    // Handle pagination clicks
    $(document).off('click', '.pagination-controls .pagination-btn').on('click', '.pagination-controls .pagination-btn', function(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log('Pagination button clicked!', $(this).data('page'));
        const newPage = $(this).data('page');
        if (newPage && !$(this).prop('disabled')) {
            console.log('Changing to page:', newPage);
            changePage(newPage);
    } else {
            console.log('Button disabled or no page data:', newPage, $(this).prop('disabled'));
        }
    });
}

function addColumnResizing() {
    let isResizing = false;
    let currentColumn = null;
    let startX = 0;
    let startWidth = 0;
    
    // Mouse down on resizer
    $(document).off('mousedown', '.column-resizer').on('mousedown', '.column-resizer', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = true;
        currentColumn = $(this).closest('th');
        startX = e.pageX;
        startWidth = currentColumn.outerWidth();
        
        $('body').addClass('col-resize-active');
        $(document).on('mousemove.resize', handleResize);
        $(document).on('mouseup.resize', stopResize);
    });
    
    function handleResize(e) {
        if (!isResizing || !currentColumn) return;
        
        const deltaX = e.pageX - startX;
        const newWidth = Math.max(400, startWidth + deltaX); // Minimum width of 400px
        
        currentColumn.css('width', newWidth + 'px');
        
        // Update corresponding cells in the same column
        const columnIndex = currentColumn.index();
        const table = currentColumn.closest('table');
        table.find('tbody tr').each(function() {
            $(this).find('td').eq(columnIndex).css('width', newWidth + 'px');
        });
    }
    
    function stopResize() {
        if (isResizing) {
            isResizing = false;
            currentColumn = null;
            $('body').removeClass('col-resize-active');
            $(document).off('mousemove.resize mouseup.resize');
        }
    }
    
    // Prevent text selection while resizing
    $(document).off('selectstart.resize').on('selectstart.resize', function(e) {
        if (isResizing) {
            e.preventDefault();
        }
    });
}

// Function to show column removal notification
function showColumnRemovalNotification(columnName) {
    // Create notification element
    const notification = $(`
        <div class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 column-notification">
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span><strong>${escapeHtml(columnName)}</strong> column removed successfully</span>
                <button class="ml-4 text-green-700 hover:text-green-900" onclick="$(this).closest('.column-notification').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `);
    
    // Add to page
    $('body').append(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}

// Function to handle column menu interactions
function addColumnMenuHandlers() {
    // Toggle column menu
    $(document).off('click', '.column-menu-btn button').on('click', '.column-menu-btn button', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const menu = $(this).siblings('.column-menu');
        const isVisible = menu.is(':visible');
        
        // Hide all other menus
        $('.column-menu').addClass('hidden');
        
        // Toggle current menu
        if (isVisible) {
            menu.addClass('hidden');
        } else {
            menu.removeClass('hidden');
        }
    });
    
    // Close menus when clicking outside
    $(document).off('click.columnMenu').on('click.columnMenu', function(e) {
        if (!$(e.target).closest('.column-menu-btn').length) {
            $('.column-menu').addClass('hidden');
        }
    });
    
    // Handle column operations
    $(document).off('click', '.move-column-left').on('click', '.move-column-left', function(e) {
        e.stopPropagation();
        const field = $(this).data('field');
        moveColumn(field, 'left');
        $('.column-menu').addClass('hidden');
    });
    
    $(document).off('click', '.move-column-right').on('click', '.move-column-right', function(e) {
        e.stopPropagation();
        const field = $(this).data('field');
        moveColumn(field, 'right');
        $('.column-menu').addClass('hidden');
    });
    
    $(document).off('click', '.duplicate-column').on('click', '.duplicate-column', function(e) {
        e.stopPropagation();
        const field = $(this).data('field');
        duplicateColumn(field);
        $('.column-menu').addClass('hidden');
    });
}

// Function to move columns
function moveColumn(field, direction) {
    // Get current field index
    const currentIndex = s.names.indexOf(field);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'left' && currentIndex > 0) {
        newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < s.names.length - 1) {
        newIndex = currentIndex + 1;
    } else {
        return; // Can't move
    }
    
    // Swap fields in the names array
    [s.names[currentIndex], s.names[newIndex]] = [s.names[newIndex], s.names[currentIndex]];
    
    // Swap data in all rows
    s.data.forEach(row => {
        [row[currentIndex], row[newIndex]] = [row[newIndex], row[currentIndex]];
    });
    
    // Regenerate table
    v();
    
    showColumnNotification(`Column moved ${direction}`, 'info');
}

// Function to duplicate column
function duplicateColumn(field) {
    // Get current field index
    const currentIndex = s.names.indexOf(field);
    if (currentIndex === -1) return;
    
    // Create new field name
    const originalName = s.names[currentIndex];
    const newFieldName = originalName + '_copy';
    
    // Insert new field after current one
    s.names.splice(currentIndex + 1, 0, newFieldName);
    
    // Duplicate data in all rows
    s.data.forEach(row => {
        row.splice(currentIndex + 1, 0, row[currentIndex]);
    });
    
    // Update headers config
    if (s.config.headers[field]) {
        s.config.headers[newFieldName] = s.config.headers[field] + ' (Copy)';
    }
    
    S(); // Save config
    v(); // Regenerate table
    
    showColumnNotification('Column duplicated successfully', 'success');
}

// Generic notification function
function showColumnNotification(message, type = 'success') {
    const colors = {
        success: 'bg-green-100 border-green-400 text-green-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        error: 'bg-red-100 border-red-400 text-red-700'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-exclamation-circle'
    };
    
    const notification = $(`
        <div class="fixed top-4 right-4 ${colors[type]} px-4 py-3 rounded shadow-lg z-50 column-notification">
            <div class="flex items-center">
                <i class="${icons[type]} mr-2"></i>
                <span>${escapeHtml(message)}</span>
                <button class="ml-4 hover:opacity-80" onclick="$(this).closest('.column-notification').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `);
    
    $('body').append(notification);
    
    setTimeout(() => {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 4000);
}

function S() {
    localStorage.setItem(s.configName, JSON.stringify(s.config))
}
function y(e) {
    $("#waitHeader").hide(),
    p("Instant Data doesn't support data extraction from this site yet. Our administrators are notified and will try to add support in the future. Thanks for trying us out!", "noResponseErr", !1, !0)
}
function k() {
    return localStorage.getItem("nextSelector:" + s.hostName)
}
function x(e, t) {
    if (!e)
        return i.reloaded ? y() : (i.reloaded = !0,
        chrome.tabs.reload(i.id, {}, function() {
            chrome.tabs.onUpdated.addListener(function e(t, n) {
                "complete" === n.status && t === i.id && (chrome.tabs.onUpdated.removeListener(e),
                R())
            })
        }));
    s.tableId = e.tableId,
    s.scraping = !1,
    s.failedToProcess = !1,
    s.processingError = null,
    s.tableSelector = e.tableSelector,
    s.startingUrl = e.href,
    s.hostName = e.hostname,
    s.previewLength = 0,
    s.configName = e.hostname + "-config",
    s.config = JSON.parse(localStorage.getItem(s.configName)) || {
        headers: {},
        deletedFields: {},
        crawlDelay: 1e3,
        maxWait: 2e4
    },
    r(t ? () => a.firePageViewEvent(s.hostName, s.startingUrl) : () => a.fireEvent("AnotherTable", {
        hostName: s.hostName,
        startingUrl: s.startingUrl
    })),
    Object.keys(s.config.deletedFields).length && $("#resetColumns").show();
    var n = N(i.url);
    $("#wrongTable").show(),
    s.config.infinateScrollChecked && ($("#nextSelectorGroup").hide(),
    $("#startScraping").show(),
    $("#infinateScroll").prop("checked", !0)),
    chrome.tabs.sendMessage(i.id, {
        action: "getTableData"
    }, function(e) {
        e && e.error ? p("Something went wrong!", "noResponseErr", !0) : e.tableId == s.tableId && (e.failedToProcess ? (p("Failed to process rows on server. Showing raw data instead.", "error", !1),
        s.failedToProcess = !0,
        s.processingError = e.processingError) : ($("#error").hide(),
        s.failedToProcess = !1),
        s.pages || s.config.infinateScrollChecked || $("#nextSelectorGroup").show(),
        s.pages || (s.nextSelector = k(),
        s.nextSelector && chrome.tabs.sendMessage(i.id, {
            action: "markNextButton",
            selector: s.nextSelector
        }, function(e) {
            e.error || $("#startScraping").show()
        })),
        $("#loadingOverlay").hide(),
        $("#content").show(),
        $("#applyNextSelector").show(),
        p('Download data or locate "Next" to crawl multiple pages', "instructions"),
        s.data = e.data,
        s.pages = 1,
        s.lastRows = e.data.length,
        s.tableSelector = e.tableSelector,
        s.goodClasses = e.goodClasses,
        s.workingTime = 0,
        q(),
        $(".download-button").show(),
        v(),
        
        // Auto-download CSV if enabled
        (function() {
            // Check if auto-download CSV is enabled AND scraping has actually occurred
            const autoDownloadCSV = document.getElementById('autoDownloadCSV');
            // Only trigger if: checkbox is checked, not already triggered, has data, and scraping has completed
            if (autoDownloadCSV && autoDownloadCSV.checked && !window.autoDownloadTriggered && s.data && s.data.length > 0 && s.scraping === false && window.scrapingHasStarted) {
                console.log('Auto-download CSV enabled, triggering download...');
                window.autoDownloadTriggered = true;
                // Trigger CSV download after a short delay to ensure UI is ready
                setTimeout(function() {
                    $("#csv").click();
                }, 2000);
            }
        })(),
        $("#csv").off("click").click(function() {
            console.log("Downloading CSV..."),
            r(b),
            P({
                download: !0
            });
            let e = w(s.data);
            e.data.forEach( (t, n) => {
                t.forEach( (t, o) => {
                    Array.isArray(t) && (e.data[n][o] = Papa.unparse([t], {
                        quotes: !0,
                        escapeChar: '"'
                    }))
                }
                )
            }
            ),
            (function() {
                // Create filename from full URL
                var filename = s.startingUrl || s.url || n;
                // Clean filename by removing protocol and special characters
                filename = filename.replace(/^https?:\/\//, '').replace(/[<>:"/\\|?*]/g, '_').replace(/\./g, '_');
                
            saveAs(new Blob([Papa.unparse(e, {
                quotes: !0,
                escapeChar: '"'
            })],{
                type: "application/octet-stream"
                }), filename + ".csv");
            })()
        }),
        $("#xlsx").off("click").click(function() {
            r(b),
            P({
                download: !0
            }),
            saveAs(new Blob([m(o(w(s.data), i.url.substring(0, 100)))],{
                type: "application/octet-stream"
            }), n + ".xlsx")
        }),
        $("#copy").off("click").click(function() {
            r(b),
            P({
                download: !0
            }),
            E(Papa.unparse(w(s.data), {
                delimiter: "\t"
            }))
        }))
    })
}
function N(e) {
    var t = new URL(e).hostname.split(".");
    return t[0].indexOf("www") > -1 ? t[1] : t[0]
}
function E(e) {
    var t = function(t) {
        t.preventDefault(),
        t.clipboardData ? t.clipboardData.setData("text/plain", e) : window.clipboardData && window.clipboardData.setData("Text", e)
    };
    window.addEventListener("copy", t),
    document.execCommand("copy"),
    window.removeEventListener("copy", t)
}
function R() {
    chrome.tabs.sendMessage(i.id, {
        action: "findTables",
        robots: l
    }, function(e) {
        x(e, !0)
    })
}
function C() {
    return $("#paginationInfinite").is(":checked") || $("#infinateScroll").is(":checked")
}
function D(e) {
    s.data = s.data.concat(e);
    var t = new Set;
    s.data.forEach(e => t.add(JSON.stringify(e))),
    s.data = Array.from(t, e => JSON.parse(e))
}
function T() {
    s.gettingNext = !1,
    s.scraping = !0,
    // Reset auto-download flag for new scraping session
    window.autoDownloadTriggered = false,
    // Mark that scraping has started (prevents auto-download on initial load)
    window.scrapingHasStarted = true,
    $("#startScraping").hide(),
    $("#stopScraping").show(),
    
    // Also handle modern UI button switching with Tailwind classes
    $('#startScraping').addClass('hidden'),
    $('#stopScraping').removeClass('hidden'),
    
    // Debug: Log button states
    console.log('Start Crawling: Button switching - Start hidden, Stop visible'),
    p("", "error"),
    p('Please wait for more pages or press "Stop crawling".', "instructions"),
    C() && $("#infinateScrollElement").hide();
    const __nextFromInput = $("#nextSelectorInput").val && $("#nextSelectorInput").val().trim();
    if (__nextFromInput) {
        s.nextSelector = __nextFromInput;
        localStorage.setItem("nextSelector:" + s.hostName, __nextFromInput);
    }
    if (!C() && s.nextSelector) {
        s.skipFirstClick = !0;
        chrome.tabs.sendMessage(i.id, {
            action: "clickNext",
            selector: s.nextSelector
        }, function(t) {
            if (t && t.error) {
                p("", "instructions"), p(t.error, t.errorId || "error", !0);
            }
        });
    }
    var t = new Date;
    !function n() {
        const o = function(e) {
            let t = {
                action: "scrollDown",
                selector: s.tableSelector
            };
            chrome.tabs.sendMessage(i.id, t, function(t) {
                if (t && t.error)
                    return p("", "instructions"),
                    p(t.error, t.errorId || "error", !0);
                $("#wrongTable").hide(),
                e()
            })
        };
        var r = function(e) {
            chrome.tabs.sendMessage(i.id, {
                action: "clickNext",
                selector: s.nextSelector
            }, function(t) {
                if (t && t.error)
                    return p("", "instructions"),
                    p(t.error, t.errorId, !0);
                $("#wrongTable").hide(),
                e()
            })
        };
        if (s.skipFirstClick) {
            r = function(e) {
                s.skipFirstClick = !1,
                e()
            }
        }
        C() && (r = o),
        e(r, function() {
            chrome.tabs.sendMessage(i.id, {
                action: "getTableData",
                selector: s.tableSelector
            }, function(e) {
                if (e) {
                    if (e.error)
                        return p("", "instructions"),
                        p(e.error, e.errorId || "error", !0);
                    e.failedToProcess ? (p("Failed to process rows. Showing raw data instead.", "error", !1),
                    s.failedToProcess = !0,
                    s.processingError = e.processingError) : ($("#error").hide(),
                    s.failedToProcess = !1),
                    s.lastRows = e.data.length,
                    s.pages++,
                    s.workingTime += new Date - t,
                    t = new Date,
                    D(e.data),
                    q(),
                    s.previewLength < c ? v() : p("Preview limited to 1000 rows.", "previewLimit"),
                    s.scraping && n()
                }
            })
        }, i.id, (s.config && s.config.maxWait) || 20000, 100, (s.config && s.config.crawlDelay) || 1000, function(e) {
            chrome.tabs.sendMessage(i.id, {}, function(t) {
                e(void 0 !== t)
            })
        })
    }()
}
function I() {
    $("#stopScraping").click(L),
    $("#crawlDelay").bind("propertychange change click keyup input paste", function() {
        var e = $(this).val();
        if (isNaN(e) || e < 0 || parseInt(1e3 * e) >= (s.config && s.config.maxWait || 20000))
            return p("Bad min waiting value", "inputError");
        p("", "inputError");
        if (s.config) s.config.crawlDelay = parseInt(1e3 * e);
        S()
    }),
    $("#maxWait").bind("propertychange change click keyup input paste", function() {
        var e = $(this).val();
        if (isNaN(e) || parseInt(1e3 * e) <= (s.config && s.config.crawlDelay || 1000))
            return p("Bad max waiting value", "inputError");
        p("", "inputError");
        if (s.config) s.config.maxWait = parseInt(1e3 * e);
        S()
    }),
    $("#resetColumns").click(function() {
        if (s.config) s.config.deletedFields = {};
        S();
        $("#resetColumns").hide();
        v()
    }),
    $("#infinateScroll, #paginationInfinite").click(function(e) {
        if (s.config) {
        s.config.infinateScrollChecked ? (s.config.infinateScrollChecked = !1,
        $("#nextSelectorGroup").show(),
        $("#applyNextSelector").show(),
        k() ? $("#startScraping").show() : $("#startScraping").hide()) : (s.config.infinateScrollChecked = !0,
        $("#nextSelectorGroup").hide(),
            $("#startScraping").show());
        S()
        }
    })
}
function L(e=null) {
    s.scraping = !1,
    console.log("Scraping stopped."),
    $("#startScraping").show(),
    $("#stopScraping").hide(),
    
    // Also handle modern UI button switching with Tailwind classes
    $('#stopScraping').addClass('hidden'),
    $('#startScraping').removeClass('hidden'),
    
    // Debug: Log button states
    console.log('Stop Crawling: Button switching - Stop hidden, Start visible'),
    
    p("Crawling stopped. Please download data or continue crawling.", "instructions"),
    
    // Auto-download CSV if enabled when scraping is stopped manually
    (function() {
        // Check if auto-download CSV is enabled
        const autoDownloadCSV = document.getElementById('autoDownloadCSV');
        if (autoDownloadCSV && autoDownloadCSV.checked && s.data && s.data.length > 0 && !window.autoDownloadTriggered) {
            console.log('Auto-download CSV enabled, triggering download after manual stop...');
            window.autoDownloadTriggered = true;
            // Trigger CSV download after a short delay to ensure UI is ready
            setTimeout(function() {
                $("#csv").click();
            }, 4000);
        }
    })()
}
function O() {
    $("#pleaseRate").show(),
    $("#rateLater").show().click(function() {
        P({
            rate: "later"
        }),
        $("#pleaseRate").hide(),
        r( () => a.fireEvent("Click", {
            button: "Rate later"
        }))
    }),
    $("#rate").show().click(function() {
        P({
            rate: "now"
        }),
        $("#pleaseRate").hide(),
        r( () => a.fireEvent("Click", {
            button: "Rate now"
        })),
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/detail/instant-data-scraper/ofaokhiedipichpaobibbnahnkdoiiah/reviews"
        })
    })
}
function P(e) {
    var t = JSON.parse(localStorage.getItem("stats")) || {
        pages: 0,
        rows: 0,
        downloads: 0,
        tabs: 0,
        lastRateRequest: null,
        lastDownloads: 0,
        lastRows: 0,
        rated: !1
    };
    e.download ? t.downloads++ : e.rate ? ("later" == e.rate && (t.lastRateRequest = (new Date).getTime(),
    t.lastDownloads = t.downloads,
    t.lastRows = t.rows),
    "now" == e.rate && (t.rated = !0)) : (1 == s.pages && t.tabs++,
    t.pages++,
    t.rows += s.lastRows),
    !t.rated && (new Date).getTime() - t.lastRateRequest > 52704e5 && t.downloads - t.lastDownloads > 9 && t.rows - t.lastRows > 999 && O(),
    localStorage.setItem("stats", JSON.stringify(t))
}
function q() {
    // Update stats in both old and new UI
    const statsData = {
        pages: s.pages || 1,
        rows: s.data ? s.data.length : 0,
        lastRows: s.lastRows || 0,
        workingTime: parseInt((s.workingTime || 0) / 1e3)
    };
    
    // Check if modern UI is being used
    const isModernUI = $('body').hasClass('bg-gray-100') || $('.grid.grid-cols-3').length > 0;
    
    if (isModernUI) {
        // Update modern UI stats
        updateModernStats(statsData);
    } else {
        // Update original stats
        const formattedTime = formatWorkingTime(statsData.workingTime);
        
    $("#stats").empty().append($("<div>", {
            text: "Pages scraped: " + statsData.pages
    })).append($("<div>", {
            text: "Rows collected: " + statsData.rows
    })).append($("<div>", {
            text: "Rows from last page: " + statsData.lastRows
    })).append($("<div>", {
            text: "Working time: " + formattedTime
        }));
    }
    
    P({})
}

function updateModernStats(statsData) {
    // Update the stats numbers in the modern UI
    const statsContainer = $('.grid.grid-cols-3');
    if (statsContainer.length > 0) {
        statsContainer.find('.text-2xl.font-bold.text-blue-600, .text-3xl.font-bold.text-blue-600').text(statsData.rows);
        statsContainer.find('.text-2xl.font-bold.text-green-600, .text-3xl.font-bold.text-green-600').text(statsData.pages);
        
        // Format working time in hh:mm:ss format
        const formattedTime = formatWorkingTime(statsData.workingTime);
        statsContainer.find('.text-2xl.font-bold.text-purple-600, .text-3xl.font-bold.text-purple-600').text(formattedTime);
        
        // Update status badge based on scraping state
        const statusBadge = statsContainer.parent().find('.bg-green-100');
        if (s.scraping) {
            statusBadge.removeClass('bg-green-100 text-green-800').addClass('bg-blue-100 text-blue-800').text('Scraping...');
        } else {
            statusBadge.removeClass('bg-blue-100 text-blue-800').addClass('bg-green-100 text-green-800').text('Ready');
        }
    }
    
    // Update crawl history progress if function is available
    if (typeof window.updateCrawlProgress === 'function' && statsData.rows > 0) {
        window.updateCrawlProgress(statsData.rows);
    }
}
async function j(e=!1) {
    var t = s.tableSelector.replace(".tablescraper-selected-table", "")
      , n = [];
    s.goodClasses.map(e => e.split(" ").map(e => "." + e).join("")).forEach(e => {
        (e = e.replace(/.tablescraper-selected-row/g, "")).length && n.push(t + " " + e + ":not(:empty)")
    }
    ),
    n.length || n.push(t + " > *:not(:empty)");
    var o = n.join(",")
      , r = [];
    let a = s.names;
    for (var i of (e && (a = a.concat(Object.keys(s.config.deletedFields))),
    a)) {
        var c = s.namePaths[i];
        let e = {
            target: "text"
        };
        e.field_id = i,
        e.param = "",
        s.config.headers[i] && (e.field_id = s.config.headers[i]);
        let t = [];
        for (var l of c) {
            let n = "";
            try {
                console.log("Picking selector..."),
                n = await U(o, l)
            } catch (e) {
                console.log(e)
            }
            console.log("Selector picked: ", n),
            t.push(n),
            (l = l.split(" ")).filter(e => "href" == e).length && (e.target = "prop",
            e.param = "href"),
            l.filter(e => "src" == e).length && (e.target = "prop",
            e.param = "src")
        }
        e.selector = t.join(","),
        r.push(e)
    }
    return [o, r]
}
function U(e, t) {
    return new Promise( (n, o) => {
        chrome.tabs.sendMessage(i.id, {
            action: "chooseSelector",
            rowSelector: e,
            path: t
        }, function(e) {
            e ? n(e.selector) : o(new Error("Could not choose selector!"))
        })
    }
    )
}
d(),
$("#wrongTable").click(function() {
    $("#hot").empty(),
    chrome.tabs.sendMessage(i.id, {
        action: "nextTable"
    }, x)
}),
$("#nextSelectorInput").on("input", function() {
    const t = $(this).val().trim();
    if (t) {
        $("#startScraping").show();
    }
}),
$("#applyNextSelector").click(function() {
  const t = $("#nextSelectorInput").val().trim();
  if (!t) {
    p('Mark "Next" button or link', "instructions");
    chrome.tabs.sendMessage(i.id, { action: "getNextButton" }, function(res){
      if (res && res.selector) {
        $("#nextSelectorInput").val(res.selector);
        s.nextSelector = res.selector;
        localStorage.setItem("nextSelector:" + s.hostName, res.selector);
        $("#startScraping").show();
        chrome.tabs.sendMessage(i.id, { action: "markNextButton", selector: s.nextSelector });
      }
    });
    return;
  }
  p("", "inputError");
  s.nextSelector = t;
  localStorage.setItem("nextSelector:" + s.hostName, t);
  $("#startScraping").show();
  chrome.tabs.sendMessage(i.id, {
    action: "markNextButton",
    selector: s.nextSelector
  }, function(e) {
    e && e.error ? p(e.error, e.errorId || "error", !0) : $("#startScraping").show();
  })
})
// Handle start scraping for both modern and legacy UI
$("#startScraping").click(function(e) {
    e.preventDefault();
    
    // Show #stopScraping button and hide #startScraping button
    $("#startScraping").hide();
    $("#stopScraping").show();
    
    // Also handle modern UI with Tailwind classes
    $("#startScraping").addClass('hidden');
    $("#stopScraping").removeClass('hidden');
    
    // Update status for modern UI
    if ($('.bg-green-100').length > 0) {
        $('.bg-green-100').removeClass('bg-green-100 text-green-800').addClass('bg-blue-100 text-blue-800').text('Scraping...');
    }
    
    console.log('Start button clicked - Stop button now visible');
    
    // Add crawl history item if function is available
    if (typeof addCrawlHistoryItem === 'function' && i && i.url) {
        currentCrawlId = addCrawlHistoryItem(i.url, i.title || 'Unknown Page');
        console.log('🚀 Started crawl session from popup.js:', currentCrawlId);
    }
    
    T(); // Call the original function
});

// Handle stop scraping for both modern and legacy UI  
$("#stopScraping").click(function(e) {
    e.preventDefault();
    
    // Hide #stopScraping button and show #startScraping button
    $("#stopScraping").hide();
    $("#startScraping").show();
    
    // Also handle modern UI with Tailwind classes
    $("#stopScraping").addClass('hidden');
    $("#startScraping").removeClass('hidden');
    
    // Update status for modern UI
    if ($('.bg-blue-100').length > 0) {
        $('.bg-blue-100').removeClass('bg-blue-100 text-blue-800').addClass('bg-green-100 text-green-800').text('Ready');
    }
    
    console.log('Stop button clicked - Start button now visible');
    
    // Update crawl history item if function is available
    if (typeof updateCrawlHistoryItem === 'function' && currentCrawlId) {
        const itemCount = s && s.data ? s.data.length : 0;
        updateCrawlHistoryItem(currentCrawlId, itemCount, 'completed');
        console.log('🏁 Completed crawl session from popup.js:', currentCrawlId, 'with', itemCount, 'items');
        currentCrawlId = null;
    }
    
    L(); // Call the original stop function
});

// Load settings when popup opens
function loadExtensionSettings() {
    if (chrome && chrome.storage) {
        chrome.storage.sync.get(['scrapperSettings'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading extension settings:', chrome.runtime.lastError);
                return;
            }
            
            const settings = result.scrapperSettings;
            if (settings) {
                console.log('Extension settings loaded:', settings);
                // Apply any relevant settings to the popup/scraping logic
                applyExtensionSettings(settings);
            } else {
                console.log('No saved settings found');
            }
        });
    } else {
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('scrapperSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                console.log('Extension settings loaded from localStorage:', settings);
                applyExtensionSettings(settings);
            } catch (e) {
                console.error('Error parsing saved extension settings:', e);
            }
        }
    }
}

// Function to apply loaded settings to the extension
function applyExtensionSettings(settings) {
    // Apply automation settings
    if (settings.autoDownloadCSV) {
        console.log('Auto-download CSV enabled');
        // Set global flag for auto-download
        window.autoDownloadCSV = true;
    }
    
    if (settings.autoUploadDrive) {
        console.log('Auto-upload to Drive enabled');
        // Set global flag for auto-upload
        window.autoUploadDrive = true;
    }
    
    // Apply webhook settings
    if (settings.webhooks && settings.webhooks.enabled) {
        console.log('Webhooks enabled:', settings.webhooks);
        // Store webhook configuration for use during scraping
        window.webhookConfig = settings.webhooks;
    }
    
    // Apply next page selectors if any
    if (settings.nextPageSelectors && settings.nextPageSelectors.length > 0) {
        console.log('Custom next page selectors loaded:', settings.nextPageSelectors);
        // Store for use in scraping logic
        window.customNextPageSelectors = settings.nextPageSelectors;
    }
    
    // Store all settings in a global variable for use throughout the extension
    window.extensionSettings = settings;
    
    console.log('✅ Extension settings applied successfully');
}

// Load settings when the popup/extension starts
$(document).ready(function() {
    console.log('🔄 Loading extension settings...');
    loadExtensionSettings();
});
