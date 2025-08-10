VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm2 
   Caption         =   "Data Selection"
   ClientHeight    =   5985
   ClientLeft      =   40
   ClientTop       =   380
   ClientWidth     =   5800
   OleObjectBlob   =   "userform2.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "UserForm2"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False





Private Sub BrValue_Click()
If BrValue.Value = True Then
Range("BeerV").EntireColumn.Hidden = False
Else
Range("BeerV").EntireColumn.Hidden = True
End If
End Sub



Private Sub CommandButton1_Click()

Unload Me
End Sub

Private Sub CustomRank_Click()
If CustomRank.Value = True Then
  Range("RankCustom").EntireColumn.Hidden = False
  
Else
  Range("RankCustom").EntireColumn.Hidden = True
End If
End Sub



Private Sub GoldRank_Click()
If GoldRank.Value = True Then
  Range("GoldRank").EntireColumn.Hidden = False
  
Else
  Range("GoldRank").EntireColumn.Hidden = True
End If
End Sub

Private Sub ECRadp_Click()
If ECRadp.Value = True Then
  Range("ADPecr").EntireColumn.Hidden = False
  
Else
  Range("ADPecr").EntireColumn.Hidden = True
End If
End Sub

Private Sub ECRrnk_Click()
If ECRrnk.Value = True Then
  Range("RankECR").EntireColumn.Hidden = False
  
Else
  Range("RankECR").EntireColumn.Hidden = True
End If
End Sub

Private Sub ESP_Click()
If ESP.Value = True Then
  Range("ESP").EntireColumn.Hidden = False
  
Else
  Range("ESP").EntireColumn.Hidden = True

End If
End Sub
Private Sub NFLavg_Click()
If NFLavg.Value = True Then
  Range("FFCadp").EntireColumn.Hidden = False
  
Else
  Range("FFCadp").EntireColumn.Hidden = True

End If
End Sub

Private Sub ESPNadp_Click()
If ESPNadp.Value = True Then
  Range("ADPespn").EntireColumn.Hidden = False
  
Else
  Range("ADPespn").EntireColumn.Hidden = True

End If
End Sub

Private Sub ESPNauc_Click()
If ESPNauc.Value = True Then
  Range("priceESPN").EntireColumn.Hidden = False
  
Else
  Range("priceESPN").EntireColumn.Hidden = True

End If
End Sub

Private Sub ESPNrnk_Click()
If ESPNrnk.Value = True Then
  Range("RankESPN").EntireColumn.Hidden = False
  
Else
  Range("RankESPN").EntireColumn.Hidden = True

End If

End Sub





Private Sub FP5PPR_Click()
If FP5PPR.Value = True Then
Range("Rank5PPR").EntireColumn.Hidden = False
Else
Range("Rank5PPR").EntireColumn.Hidden = True
End If
End Sub

Private Sub FProok_Click()
If FProok.Value = True Then
Range("rookies").EntireColumn.Hidden = False
Else
Range("rookies").EntireColumn.Hidden = True
End If
End Sub
Private Sub FPdynasty_Click()
If FPdynasty.Value = True Then
Range("dynasty").EntireColumn.Hidden = False
Else
Range("dynasty").EntireColumn.Hidden = True
End If
End Sub



Private Sub NFLadp_Click()
If NFLadp.Value = True Then
Range("ADPnfl").EntireColumn.Hidden = False
Else
Range("ADPnfl").EntireColumn.Hidden = True
End If
End Sub

Private Sub NFLauc_Click()

If NFLauc.Value = True Then
Range("PriceNFL").EntireColumn.Hidden = False
Else
Range("PriceNFL").EntireColumn.Hidden = True
End If
End Sub

Private Sub NFLprice_Click()
If NFLprice.Value = True Then
Range("nflprice").EntireColumn.Hidden = False
Else
Range("nflprice").EntireColumn.Hidden = True
End If
End Sub


Private Sub NFLrnk_Click()

If NFLrnk.Value = True Then
Range("RankNFL").EntireColumn.Hidden = False
Else
Range("RankNFL").EntireColumn.Hidden = True
End If
End Sub

Private Sub overallavg_Click()
If overallavg.Value = True Then
Range("dynADP").EntireColumn.Hidden = False
Else
Range("dynADP").EntireColumn.Hidden = True
End If
End Sub

Private Sub PosScarc_Click()
If PosScarc.Value = True Then
Range("BeerScarcity").EntireColumn.Hidden = False
Else
Range("BeerScarcity").EntireColumn.Hidden = True
End If
End Sub

Private Sub inflprice_Click()
If InflPrice.Value = True Then
  Range("ADPppr").EntireColumn.Hidden = False
  
Else
  Range("ADPppr").EntireColumn.Hidden = True
End If
End Sub

Private Sub PPRrnk_Click()
If PPRrnk.Value = True Then
  Range("RankPPR").EntireColumn.Hidden = False
  
Else
  Range("RankPPR").EntireColumn.Hidden = True
End If
End Sub

Private Sub PrjPnts_Click()
If PrjPnts.Value = True Then
  Range("PointProj").EntireColumn.Hidden = False
  
Else
  Range("PointProj").EntireColumn.Hidden = True
End If
End Sub

Private Sub ProjectdAuc_Click()
If ProjectdAuc.Value = True Then
  Range("PricePrj").EntireColumn.Hidden = False
  
Else
  Range("PricePrj").EntireColumn.Hidden = True
End If
End Sub

Private Sub ProjPrice_Click()
If ProjPrice.Value = True Then
Range("projprice").EntireColumn.Hidden = False
Else
Range("projprice").EntireColumn.Hidden = True
End If
End Sub

Private Sub RankDiff_Click()
If RankDiff.Value = True Then
Range("RankDiff").EntireColumn.Hidden = False
Else
Range("RankDiff").EntireColumn.Hidden = True
End If
End Sub

Private Sub RnkSkew_Click()
If RnkSkew.Value = True Then
Range("Skew").EntireColumn.Hidden = False
Else
Range("Skew").EntireColumn.Hidden = True
End If
End Sub

Private Sub SkewAct_Click()
If SkewAct.Value = True Then
  Range("PriceSkew").EntireColumn.Hidden = False
  
Else
  Range("PriceSkew").EntireColumn.Hidden = True
End If
End Sub




Private Sub Tier5PPR_Click()
If Tier5PPR.Value = True Then
  Range("tr5PPR").EntireColumn.Hidden = False
  
Else
  Range("tr5PPR").EntireColumn.Hidden = True
End If
End Sub

Private Sub TierPPR_Click()
If TierPPR.Value = True Then
  Range("trPPR").EntireColumn.Hidden = False
  
Else
  Range("trPPR").EntireColumn.Hidden = True
End If
End Sub

Private Sub TierStd_Click()
If TierStd.Value = True Then
  Range("trSTD").EntireColumn.Hidden = False
  
Else
  Range("trSTD").EntireColumn.Hidden = True
End If
End Sub

Private Sub UserForm_Click()

End Sub


Private Sub VBD_Click()
If vbd.Value = True Then
  Range("VBD").EntireColumn.Hidden = False
  
Else
  Range("VBD").EntireColumn.Hidden = True
End If
End Sub
Private Sub VBDval_Click()
If vbdval.Value = True Then
  Range("VBDval").EntireColumn.Hidden = False
  
Else
  Range("VBDval").EntireColumn.Hidden = True
End If
End Sub
Private Sub VBDtier_Click()
If vbdtier.Value = True Then
  Range("VBDtier").EntireColumn.Hidden = False
  
Else
  Range("VBDtier").EntireColumn.Hidden = True
End If
End Sub

Private Sub YahooADP_Click()
If YahooADP.Value = True Then
  Range("ADPyahoo").EntireColumn.Hidden = False
  
Else
  Range("ADPyahoo").EntireColumn.Hidden = True
End If
End Sub

Private Sub YahooRnk_Click()

If YahooRnk.Value = True Then
  Range("RankYahoo").EntireColumn.Hidden = False
  
Else
  Range("RankYahoo").EntireColumn.Hidden = True
End If
End Sub
