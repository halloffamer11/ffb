Attribute VB_Name = "Module5"
Sub ImportFromOld()
On Error GoTo errHandler


MsgBox "Please select the CSG Fantasy Football excel file that you would like to import and make sure it is also open"
'find file name of old keeper sheet

    Dim sFullName As String
    Dim sFileName As String

    sFullName = Application.GetOpenFilename("*.xlsm,*.xlsm")
    sFileName = Dir(sFullName)

    Debug.Print sFullName, sFileName

'paste the file name into cell E51

  Range("E51").Value = sFileName

'set old worksheet name to value in E56

Dim OldSheet As String, oldws As Workbook
OldSheet = Sheets("League Info").Range("E56").Value
Set oldws = Workbooks(OldSheet)

'set new (current) worksheet name

Dim NewSheet As String, Newws As Workbook
NewSheet = Sheets("League Info").Range("E55").Value
Set Newws = Workbooks(NewSheet)

' copy league info over
 Newws.Sheets("League Info").Range("I2:I12").Value = oldws.Sheets("League Info").Range("I2:I12").Value

 Newws.Sheets("League Info").Range("L3:L22").Value = oldws.Sheets("League Info").Range("L3:L22").Value

Newws.Sheets("League Info").Range("J26:J36").Value = oldws.Sheets("League Info").Range("J26:J37").Value

 Newws.Sheets("League Info").Range("M27:M31").Value = oldws.Sheets("League Info").Range("M27:M31").Value
       
       Newws.Sheets("League Info").Range("M33:M35").Value = oldws.Sheets("League Info").Range("M33:M35").Value
       Newws.Sheets("League Info").Range("M37:M39").Value = oldws.Sheets("League Info").Range("M37:M39").Value
'copy pick trades
 Newws.Sheets("Pick Trades").Range("D3:D802").Value = oldws.Sheets("Pick Trades").Range("D3:D802").Value

 'update old sheet with added names
 
 oldws.Worksheets("Overall").Range("M12:M642").Replace _
 What:="Dare Ogunbowale", Replacement:="Adrian Peterson"
 
  

 
'Copy Draft Picks - but first sort alphabetically
Newws.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Player]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
    
 oldws.Activate
 
 'show drafted players
 ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=12, Criteria1:= _
        "No"
 ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=12
 
  ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=13
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Player]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
'then sort

oldws.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Player]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
    'Now copy picks from old sheet
    
Newws.Sheets("Overall").Range("J12:J800").Value = oldws.Sheets("Overall").Range("J12:J800").Value
Newws.Sheets("Overall").Range("R12:R800").Value = oldws.Sheets("Overall").Range("R12:R800").Value
Newws.Sheets("Overall").Range("I12:I800").Value = oldws.Sheets("Overall").Range("I12:I800").Value

MsgBox "Import Complete. You may now close your old sheet."
 
 Exit Sub

 
errHandler:
MsgBox ("Error: Please ensure the file you want imported is open"), , "Error"
End Sub

