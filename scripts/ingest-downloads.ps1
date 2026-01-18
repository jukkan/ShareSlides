$RepoRoot  = "E:\Dev\jukkan\ShareSlides"
$Downloads = "E:\JukkaNiiranen\Downloads"
$Target    = Join-Path $RepoRoot "public\decks"

$map = @{
  "dataverse-meets-teams-low-code-app-opportunities-for-everyon" = "dataversemeetsteamstn22final-220323121700.pptx"
  "microsoft-business-applications-summit-2020-parhaat-palat"    = "mbas2020fdug-200514181913.pptx"
  "liiketoimintatietojen-turvaaminen-microsoftin-pilvipalveluid" = "liiketoimintatietojenturvaaminenmicrosoftinpilvipalveluidenavulla-191024074941.pdf"
  "fdug-october-2019-virtual-launch-event-highlights"           = "msbizappsoctober2019virtuallauncheventfdug-191017125609.pdf"
  "towards-a-common-app-platform-spugfi"                        = "towardsacommonappplatform-spugfi-190830055515.pdf"
  "canvas-apps-for-the-model-driven-mind"                       = "canvasappsforthemodel-drivenmind-190829060503.pdf"
  "elisa-webinaari-mita-seuraava-microsoftin-business-applicati"= "businessapplicationsapril2019webinaaripublic-190404120816.pdf"
  "demystifying-dynamics-365-power-platform-licensing"          = "d365saturdaylondon-demystifyingd365powerplatformlicensing-190131174549.pdf"
  "elisa-dynamics-365-webinaari-26-11-2018-tekoalya-ja-analytii" = "elisadynamics365aiteamsmarketingwebinaari2018-11-26-181130094538.pdf"
  "microsoft-ignite-2018-in-30-minutes"                         = "fdug1ignite2018summary-181019155807.pptx"
  "microsoft-flow-and-dynamics-365-jukka-niiranen-at-crm-saturd" = "microsoftflowanddynamics365-jukkaniiranencrmsaturdayoslo-170829170710.pdf"
  "dynamics-crm-in-2010-5-year-retrospective"                   = "dynamicscrmin2010-5yearretrospective-151228124012.pptx"
  "microsoft-dynamics-crm-2011-walkthrough-part-1"              = "crm2011walkthroughpart1-101012131626-phpapp02.pptx"
  "microsoft-dynamics-crm-2011-walkthrough-part-2"              = "crm2011walkthroughpart2-101107123744-phpapp02.pptx"
  "using-microsoft-social-engagement-together-with-dynamics-crm" = "msdwmsewebinarfinal-151117200239-lva1-app6891.pptx"
  "smarter-sales-process-in-dynamics-crm-2015-part-1-lead-quali" = "smartersalesprocessincrm2015-part1leadqualification-150510170117-lva1-app6891.pptx"
  "smarter-sales-process-in-dynamics-crm-2015-part-2-revenue-es" = "smartersalesprocessincrm2015-part2estimatedrevenue-150520165830-lva1-app6891.pptx"
  "smarter-sales-process-in-dynamics-crm-2015-part-3-pipeline-d" = "smartersalesprocessincrm2015-part3pipelinedevelopment-150603194723-lva1-app6891.pptx"
  "who-is-the-customer-in-your-crm-crmrocks-podcast"             = "crmrocks-whoisthecustomer-141209134306-conversion-gate01.pptx"
  "10-tips-for-designing-a-great-user-experience-in-microsoft-d" = "10uxtipsformicrosoftdynamicscrm-140928060427-phpapp01.pptx"
  "microsoft-dynamics-crm-2013-customization-and-the-platform-e" = "dynamicscrm2013customizationandtheplatformevolution-140528114226-phpapp01.pptx"
  "microsoft-dynamics-crm-2013-development-server-installation"  = "crm2013developmentserverinstallation-131008111241-phpapp02.pptx"
  "a-story-of-blog-content-theft"                                = "astoryofdynamicscrmblogtheft-120922122018-phpapp02.pptx"
  "website-image-editing-tutorial-wordpress-paint-net-and-power" = "websiteimageeditingtutorial-111206111056-phpapp02.pptx"
  "sfdc-df11"                                                    = "sfdcdf11-110901005523-phpapp01.pptx"
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null

foreach ($deckId in $map.Keys) {
  $src = Join-Path $Downloads $map[$deckId]
  if (-not (Test-Path $src)) {
    Write-Warning "Missing: $($map[$deckId]) for $deckId"
    continue
  }

  $deckDir = Join-Path $Target $deckId
  New-Item -ItemType Directory -Force -Path $deckDir | Out-Null

  $ext = [IO.Path]::GetExtension($src).ToLowerInvariant()
  $destName = if ($ext -eq ".pdf") { "deck.pdf" } else { "deck.pptx" }
  $dest = Join-Path $deckDir $destName

  Move-Item -Force $src $dest
  Write-Host "Moved $($map[$deckId]) -> public/decks/$deckId/$destName"
}