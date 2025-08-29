Attribute VB_Name = "Module13"
Sub NFLadp()
Attribute NFLadp.VB_ProcData.VB_Invoke_Func = " \n14"
'
' NFLadp Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ESPN Avg Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub YahooADP()
Attribute YahooADP.VB_ProcData.VB_Invoke_Func = " \n14"
'
' YahooADP Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Yahoo Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub YahooRnk()
Attribute YahooRnk.VB_ProcData.VB_Invoke_Func = " \n14"
'
' YahooRnk Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Yahoo]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub NFLrnk()
Attribute NFLrnk.VB_ProcData.VB_Invoke_Func = " \n14"
'
' NFLrnk Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[NFL]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub PPRadp()
Attribute PPRadp.VB_ProcData.VB_Invoke_Func = " \n14"
'
' pprADP Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Inflated Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub PPRrnk()
Attribute PPRrnk.VB_ProcData.VB_Invoke_Func = " \n14"
'
' pprRNK Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[PPR]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub

